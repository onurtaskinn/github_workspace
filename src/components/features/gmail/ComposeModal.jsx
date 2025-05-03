// src/components/features/gmail/ComposeModal.jsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFileSelection } from '../../../hooks/useFileSelection';
import browserApi from '../../../utils/browserApi';

export const ComposeModal = ({ onClose }) => {
    const [recipients, setRecipients] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]); // Sadece dosya adlarэ tutulacak
    const [isSending, setIsSending] = useState(false);
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [encryptedMessage, setEncryptedMessage] = useState('');

    const { showNotification } = useNotification();
    const { handleFileSelection } = useFileSelection();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const validateForm = () => {
        if (!recipients.trim()) {
            showNotification('Lütfen en az bir alıcı girin', 'error');
            return false;
        }
        const emails = recipients.split(',').map(email => email.trim());
        for (const email of emails) {
            if (!validateEmail(email)) {
                showNotification(`"${email}" geçerli bir e-posta adresi değil`, 'error');
                return false;
            }
        }
        if (!subject.trim()) {
            showNotification('Lütfen bir konu girin', 'error');
            return false;
        }
        if (!message.trim()) {
            showNotification('Lütfen bir mesaj girin', 'error');
            return false;
        }
        return true;
    };

    // Desktop/test_files klasöründen dosya seçimi
    const handleAddAttachment = () => {
        handleFileSelection('*.*', (file) => {
            // Dosya zaten test_files klasöründe olduğu için sadece adını saklıyoruz
            const newAttachment = {
                filename: file.name,
                path: file.name, // Tam yolu gerekirse burada düzenlenebilir
                mimeType: file.type || 'application/octet-stream'
            };

            setAttachments(prev => [...prev, newAttachment]);
            showNotification(`${file.name} eklendi`, 'success');
        });
    };

    // Eklentiyi kaldır
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Dosyayı imzala ve imza dosyasını döndür
    const signFile = async (filename) => {
        try {
            const response = await browserApi.signDocument(filename);

            if (response.success) {
                // İmzalama başarılıysa, oluşturulan .sig dosyasını döndür
                return {
                    filename: `${filename}.sig`,
                    path: `${filename}.sig`,
                    mimeType: 'application/octet-stream'
                };
            } else {
                throw new Error(`Dosya imzalanamadı: ${response.message || 'Bilinmeyen hata'}`);
            }
        } catch (error) {
            console.error('Dosya imzalama hatası:', error);
            throw error;
        }
    };

    // Mesajı şifrele
    const handleEncrypt = () => {
        if (!validateForm()) {
            return;
        }

        setIsEncrypting(true);

        // Kullanıcıdan şifreleme için alıcının public key dosyasını seçmesini iste
        handleFileSelection('.key,.pub', async (keyFile) => {
            try {
                showNotification('Mesaj şifreleniyor...', 'info');

                // Backend'e mesajı şifrelemek için gönder
                const response = await browserApi.sendMessageToNative(
                    'encrypt',
                    'encrypt_email',
                    {
                        text: message,
                        keypath: keyFile.name
                    }
                );

                if (response && response.success) {
                    setEncryptedMessage(response.data);
                    setIsEncrypted(true);
                    showNotification('Mesaj başarıyla şifrelendi', 'success');
                } else {
                    throw new Error(response?.message || 'Şifreleme işlemi başarısız oldu');
                }
            } catch (error) {
                console.error('Şifreleme hatası:', error);
                showNotification(`Şifreleme hatası: ${error.message}`, 'error');
            } finally {
                setIsEncrypting(false);
            }
        });
    };

    const handleSend = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSending(true);
        console.log("Form doğrulandı, mesaj işleniyor...");

        try {
            // Mesaj şifrelenmiş mi kontrol et
            let messageToSend;

            if (isEncrypted) {
                // Eğer mesaj şifrelenmişse, şifrelenmiş mesajı kullan
                messageToSend = encryptedMessage;
                console.log("Şifrelenmiş mesaj gönderiliyor");
            } else {
                // Değilse, normal imzalama işlemi yap
                console.log("browserApi.signText çağrılıyor...");
                const signResponse = await browserApi.signText(message);
                console.log("İmzalama yanıtı alındı:", signResponse);

                if (signResponse && signResponse.success) {
                    messageToSend = signResponse.data;
                    console.log("Mesaj başarıyla imzalandı, uzunluk:", messageToSend.length);
                } else {
                    throw new Error(signResponse?.message || 'İmzalama işlemi başarısız oldu');
                }
            }

            // Şimdi ekleri hazırla
            let emailAttachments = [];

            // Her bir dosyayı ve imza dosyasını e-postaya ekle
            for (const attachment of attachments) {
                try {
                    // Orijinal dosyayı ekle
                    emailAttachments.push({
                        filename: attachment.filename,
                        path: attachment.path,
                        mimeType: attachment.mimeType
                    });

                    // Dosyayı imzala
                    showNotification(`${attachment.filename} imzalanıyor...`, 'info');
                    const signatureFile = await signFile(attachment.path);

                    // İmza dosyasını ekle
                    emailAttachments.push(signatureFile);

                    showNotification(`${attachment.filename} imzalandı`, 'success');
                } catch (error) {
                    console.error(`Dosya işlenirken hata: ${attachment.filename}`, error);
                    showNotification(`${attachment.filename} imzalanırken hata oluştu`, 'error');
                }
            }

            console.log("Chrome runtime üzerinden e-posta gönderiliyor...");

            // E-posta gönder
            chrome.runtime.sendMessage({
                action: 'sendEmail',
                to: recipients,
                subject: isEncrypted ? `[Encrypted] ${subject}` : subject,
                body: messageToSend,
                attachments: emailAttachments
            }, (response) => {
                console.log("E-posta gönderme yanıtı:", response);
                setIsSending(false);

                if (response && response.success) {
                    showNotification('E-posta başarıyla gönderildi', 'success');
                    setTimeout(() => onClose(), 1500);
                } else {
                    const errorMsg = response?.error || 'Bilinmeyen hata';
                    console.error("E-posta gönderme hatası:", errorMsg);
                    showNotification(`E-posta gönderilemedi: ${errorMsg}`, 'error');
                }
            });
        } catch (error) {
            console.error("handleSend'de hata:", error);
            setIsSending(false);
            showNotification(`Hata: ${error.message}`, 'error');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {isEncrypted ? "Şifrelenmiş E-posta Oluştur" : "Güvenli E-posta Oluştur"}
                </h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Alıcılar:
                        </label>
                        <input
                            type="text"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            placeholder="ornek@gmail.com, baska@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Konu:
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            placeholder="E-posta konusu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mesaj:
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`w-full px-3 py-2 border ${isEncrypted ? 'bg-gray-100 dark:bg-gray-600' : ''} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600`}
                            rows="6"
                            placeholder="Mesajınız..."
                            disabled={isEncrypted}
                        />
                        {isEncrypted && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                Mesaj şifrelenmiştir ve sadece alıcı tarafından okunabilir.
                            </p>
                        )}
                    </div>

                    {/* Eklentiler Bölümü */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Eklentiler:
                            </label>
                            <button
                                onClick={handleAddAttachment}
                                disabled={isSending || isEncrypting}
                                className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40"
                            >
                                Dosya Ekle
                            </button>
                        </div>

                        {/* Seçilen eklentileri göster */}
                        {attachments.length > 0 ? (
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border dark:border-gray-600 rounded-md p-2">
                                {attachments.map((att, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        <span className="truncate pr-2" title={att.filename}>
                                            {att.filename}
                                        </span>
                                        <button
                                            onClick={() => removeAttachment(index)}
                                            className="text-red-500 hover:text-red-700 font-bold"
                                            title="Eklentiyi kaldır"
                                            disabled={isSending || isEncrypting}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                                Henüz dosya eklenmedi. Eklemek için "Dosya Ekle" düğmesine tıklayın.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-2 border-t dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors duration-200 ease-in-out dark:text-gray-300 dark:hover:text-gray-100"
                        disabled={isSending || isEncrypting}
                    >
                        İptal
                    </button>

                    {!isEncrypted && (
                        <button
                            onClick={handleEncrypt}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 ease-in-out"
                            disabled={isSending || isEncrypting}
                        >
                            {isEncrypting ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Şifreleniyor...
                                </>
                            ) : 'Şifrele'}
                        </button>
                    )}

                    <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ease-in-out"
                        disabled={isSending || isEncrypting}
                    >
                        {isSending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Gönderiliyor...
                            </>
                        ) : 'E-posta Gönder'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};