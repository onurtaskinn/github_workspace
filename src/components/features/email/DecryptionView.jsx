// src/components/features/email/DecryptionView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import browserApi from '../../../utils/browserApi';
import Card from '../../common/Card';
import Button from '../../common/Button';

export const DecryptionView = ({ encryptedContent, onClose }) => {
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const [decryptedContent, setDecryptedContent] = useState('');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [signatureVerified, setSignatureVerified] = useState(false);
    const [signatureInfo, setSignatureInfo] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Kullanýcý zaten authenticate olmuþsa otomatik olarak þifre çözmeyi baþlat
        if (isAuthenticated && encryptedContent && !isDecrypted && !isDecrypting) {
            handleDecrypt();
        }
    }, [isAuthenticated, encryptedContent]);

    const verifySignature = async (content) => {
        try {
            setIsVerifying(true);
            // Ýmza bloðunu kontrol et
            const signatureRegex = /-----BEGIN E-SBSL SIGNATURE-----\n(.*?)\n-----END E-SBSL SIGNATURE-----/s;
            const signatureMatch = content.match(signatureRegex);

            if (signatureMatch) {
                const signatureHex = signatureMatch[1];
                const originalText = content.substring(0, signatureMatch.index).trim();

                console.log('Found signature in decrypted content');
                console.log('Original text length:', originalText.length);

                // E-posta adresi bilgisini de çýkarmamýz gerekiyor
                // Bu bilgi doðrudan elimizde olmayabilir, sunucuya baðlanarak veya
                // kullanýcýnýn giren kimliði ile kontrol edebiliriz

                // Alternatif olarak, browserApi'yi kullanarak doðrulama yapabiliriz
                const response = await fetch('https://getauth.com.tr:3030/api/verifyGmailSignature', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        originalText: originalText,
                        signatureHex: signatureHex
                        // E-posta adresi zorunlu deðilse, bu þekilde gönderilebilir
                        // Gerekirse gönderen e-posta adresi burada eklenmeli
                    })
                });

                const result = await response.json();
                console.log('Signature verification result:', result);

                if (result && result.success) {
                    setSignatureVerified(true);
                    setSignatureInfo(result);
                    showNotification('Ýmza doðrulandý', 'success');
                } else {
                    setSignatureVerified(false);
                    showNotification('Ýmza doðrulanamadý', 'warning');
                }
            } else {
                console.log('No signature found in decrypted content');
                setSignatureVerified(false);
            }
        } catch (error) {
            console.error('Error verifying signature:', error);
            setSignatureVerified(false);
            showNotification('Ýmza doðrulama hatasý', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDecrypt = async () => {
        if (!encryptedContent || isDecrypting) return;

        setIsDecrypting(true);
        try {
            showNotification('Þifreli içerik çözülüyor...', 'info');

            // Backend'e þifrelenmiþ içeriði gönder
            const response = await browserApi.decryptEmail(encryptedContent);

            if (response && response.success) {
                setDecryptedContent(response.data);
                setIsDecrypted(true);
                showNotification('Ýçerik baþarýyla çözüldü', 'success');

                // Ýçerik çözüldükten sonra imza doðrulamasýný yap
                await verifySignature(response.data);
            } else {
                throw new Error(response?.message || 'Þifre çözme iþlemi baþarýsýz oldu');
            }
        } catch (error) {
            console.error('Þifre çözme hatasý:', error);
            showNotification(`Þifre çözme hatasý: ${error.message}`, 'error');
        } finally {
            setIsDecrypting(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(decryptedContent)
            .then(() => {
                showNotification('Ýçerik panoya kopyalandý', 'success');
            })
            .catch(err => {
                console.error('Panoya kopyalama hatasý:', err);
                showNotification('Panoya kopyalanýrken hata oluþtu', 'error');
            });
    };

    const renderSignatureVerification = () => {
        if (isVerifying) {
            return (
                <div className="mt-4 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">Ýmza doðrulanýyor...</span>
                    </div>
                </div>
            );
        }

        if (signatureVerified && signatureInfo) {
            return (
                <div className="mt-4 py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-700 dark:text-green-400">
                            Ýmzalayan: {signatureInfo.fullName || 'Doðrulanmýþ Kullanýcý'}
                        </span>
                    </div>
                </div>
            );
        }

        if (!signatureVerified && isDecrypted) {
            return (
                <div className="mt-4 py-2 px-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                            E-posta imzasý doðrulanamadý veya imza bulunamadý
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Þifreli E-posta
            </h2>

            {!isAuthenticated ? (
                <Card
                    title="Kimlik Doðrulama Gerekli"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>}
                    description="Bu þifreli içeriði görüntülemek için oturum açmanýz gerekiyor."
                />
            ) : (
                <>
                    {isDecrypting ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Þifreli içerik çözülüyor...</p>
                        </div>
                    ) : isDecrypted ? (
                        <div className="space-y-4">
                            {/* Ýmza doðrulama bilgisini göster */}
                            {renderSignatureVerification()}

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Çözülen Ýçerik</h3>
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                        title="Panoya kopyala"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto">
                                    {decryptedContent}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={onClose}>
                                    Kapat
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Card
                                title="Þifreli Ýçerik"
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>}
                                description="Bu e-posta þifrelenmiþtir ve yalnýzca siz görüntüleyebilirsiniz."
                            />

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={onClose}>
                                    Ýptal
                                </Button>
                                <Button onClick={handleDecrypt}>
                                    Þifreyi Çöz
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};