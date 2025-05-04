import React, { useState } from 'react';
import { usePgp } from '../../../hooks/usePgp';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { Modal } from '../../common/Modal';

export const PgpTab = () => {
  const { 
    generateKeyPair, 
    signFile, 
    verifySignature, 
    encryptFile,
    decryptFile,
    downloadAsFile, 
    isGenerating, 
    isProcessing 
  } = usePgp();

  // Key pair generation state
  const [showKeyGenModal, setShowKeyGenModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState(null);
  
  // File signing state
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [fileToSign, setFileToSign] = useState(null);
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [signingPassphrase, setSigningPassphrase] = useState('');
  
  // Signature verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [publicKeyFile, setPublicKeyFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifiedKeyID, setVerifiedKeyID] = useState(null);

  // Encryption state
  const [showEncryptModal, setShowEncryptModal] = useState(false);
  const [fileToEncrypt, setFileToEncrypt] = useState(null);
  const [encryptionPublicKeyFile, setEncryptionPublicKeyFile] = useState(null);

  // Decryption state
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [fileToDecrypt, setFileToDecrypt] = useState(null);
  const [decryptionPrivateKeyFile, setDecryptionPrivateKeyFile] = useState(null);
  const [decryptionPassphrase, setDecryptionPassphrase] = useState('');

  // Anahtar çifti oluştur
  const handleGenerateKeyPair = async () => {
    const keys = await generateKeyPair(name, email, passphrase);
    if (keys) {
      setGeneratedKeys(keys);
    }
  };

  // Anahtarları indir
  const handleDownloadKeys = () => {
    if (generatedKeys) {
      downloadAsFile(generatedKeys.publicKey, `${name.replace(/\s+/g, '_')}_public.asc`);
      downloadAsFile(generatedKeys.privateKey, `${name.replace(/\s+/g, '_')}_private.asc`);
      downloadAsFile(generatedKeys.revocationCertificate, `${name.replace(/\s+/g, '_')}_revocation.asc`);
    }
  };

  // Dosya imzala
  const handleSignFileClick = () => {
    setFileToSign(null);
    setPrivateKeyFile(null);
    setSigningPassphrase('');
    setShowSigningModal(true);
  };

  const handleSignFile = async () => {
    if (!fileToSign || !privateKeyFile || !signingPassphrase) {
      return;
    }

    const signatureData = await signFile(fileToSign, privateKeyFile, signingPassphrase);
    if (signatureData) {
      downloadAsFile(signatureData.content, signatureData.fileName);
      setShowSigningModal(false);
    }
  };

  // İmza doğrula
  const handleVerifyClick = () => {
    setOriginalFile(null);
    setSignatureFile(null);
    setPublicKeyFile(null);
    setVerificationResult(null);
    setVerifiedKeyID(null);
    setShowVerifyModal(true);
  };

  const handleVerifySignature = async () => {
    if (!originalFile || !signatureFile || !publicKeyFile) {
      return;
    }

    const result = await verifySignature(originalFile, signatureFile, publicKeyFile);
    if (result && result.success) {
      setVerificationResult('valid');
      setVerifiedKeyID(result.keyID);
    } else if (result === false) {
      setVerificationResult('invalid');
    } else {
      setVerificationResult('error');
    }
  };

  // Dosya şifrele
  const handleEncryptFileClick = () => {
    setFileToEncrypt(null);
    setEncryptionPublicKeyFile(null);
    setShowEncryptModal(true);
  };

  const handleEncryptFile = async () => {
    if (!fileToEncrypt || !encryptionPublicKeyFile) {
      return;
    }

    const encryptedData = await encryptFile(fileToEncrypt, encryptionPublicKeyFile);
    if (encryptedData) {
      downloadAsFile(encryptedData.content, encryptedData.fileName);
      setShowEncryptModal(false);
    }
  };

  // Dosya şifresini çöz
  const handleDecryptFileClick = () => {
    setFileToDecrypt(null);
    setDecryptionPrivateKeyFile(null);
    setDecryptionPassphrase('');
    setShowDecryptModal(true);
  };

  const handleDecryptFile = async () => {
    if (!fileToDecrypt || !decryptionPrivateKeyFile || !decryptionPassphrase) {
      return;
    }

    const decryptedData = await decryptFile(fileToDecrypt, decryptionPrivateKeyFile, decryptionPassphrase);
    if (decryptedData) {
      downloadAsFile(decryptedData.content, decryptedData.fileName);
      setShowDecryptModal(false);
    }
  };

  // Key generation modal
  const renderKeyGenModal = () => (
    <Modal isOpen={showKeyGenModal} onClose={() => setShowKeyGenModal(false)} title="PGP Anahtar Çifti Oluştur">
      <div className="space-y-4">
        <Input
          label="İsim"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="E-posta"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Passphrase"
          type="password"
          placeholder="Güçlü bir şifre girin"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
        
        {generatedKeys ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 text-sm">
                Anahtar çifti başarıyla oluşturuldu! Anahtarlarınızı güvenli bir yerde saklayın.
              </p>
            </div>
            <Button onClick={handleDownloadKeys} fullWidth>
              Anahtarları İndir
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerateKeyPair} isLoading={isGenerating} fullWidth>
            {isGenerating ? 'Oluşturuluyor...' : 'Anahtar Çifti Oluştur'}
          </Button>
        )}
      </div>
    </Modal>
  );

  // File signing modal
  const renderSigningModal = () => (
    <Modal isOpen={showSigningModal} onClose={() => setShowSigningModal(false)} title="Dosya İmzala">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            İmzalanacak Dosya
          </label>
          {fileToSign ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{fileToSign.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setFileToSign(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('fileToSign').click()}
            >
              Dosya Seç
            </Button>
          )}
          <input
            id="fileToSign"
            type="file"
            className="hidden"
            onChange={(e) => setFileToSign(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Özel Anahtar (Private Key)
          </label>
          {privateKeyFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{privateKeyFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setPrivateKeyFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('privateKeyFile').click()}
            >
              Özel Anahtar Seç
            </Button>
          )}
          <input
            id="privateKeyFile"
            type="file"
            className="hidden"
            accept=".asc,.pgp,.gpg"
            onChange={(e) => setPrivateKeyFile(e.target.files[0])}
          />
        </div>

        <Input
          label="Passphrase"
          type="password"
          placeholder="Özel anahtarınızın parolası"
          value={signingPassphrase}
          onChange={(e) => setSigningPassphrase(e.target.value)}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setShowSigningModal(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleSignFile} 
            isLoading={isProcessing}
            disabled={!fileToSign || !privateKeyFile || !signingPassphrase}
          >
            {isProcessing ? 'İmzalanıyor...' : 'İmzala'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Signature verification modal
  const renderVerifyModal = () => (
    <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title="İmza Doğrula">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Orijinal Dosya
          </label>
          {originalFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{originalFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setOriginalFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('originalFile').click()}
            >
              Dosya Seç
            </Button>
          )}
          <input
            id="originalFile"
            type="file"
            className="hidden"
            onChange={(e) => setOriginalFile(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            İmza Dosyası (.sig)
          </label>
          {signatureFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{signatureFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setSignatureFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('signatureFile').click()}
            >
              İmza Dosyası Seç
            </Button>
          )}
          <input
            id="signatureFile"
            type="file"
            className="hidden"
            accept=".sig,.asc,.pgp,.gpg"
            onChange={(e) => setSignatureFile(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Açık Anahtar (Public Key)
          </label>
          {publicKeyFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{publicKeyFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setPublicKeyFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('publicKeyFile').click()}
            >
              Açık Anahtar Seç
            </Button>
          )}
          <input
            id="publicKeyFile"
            type="file"
            className="hidden"
            accept=".asc,.pgp,.gpg"
            onChange={(e) => setPublicKeyFile(e.target.files[0])}
          />
        </div>

        {verificationResult && (
          <div className={`mt-4 p-3 rounded-lg border ${
            verificationResult === 'valid' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : verificationResult === 'invalid'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            {verificationResult === 'valid' && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">İmza Doğrulandı!</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    İmzalayan Anahtar ID: {verifiedKeyID || "Bilinmiyor"}
                  </p>
                </div>
              </div>
            )}
            {verificationResult === 'invalid' && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">İmza Geçersiz!</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    İmza doğrulanamadı veya imzalayan anahtar eşleşmiyor.
                  </p>
                </div>
              </div>
            )}
            {verificationResult === 'error' && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">Hata Oluştu!</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    İmza doğrulama sırasında bir hata oluştu. Lütfen dosyaları kontrol edin.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setShowVerifyModal(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleVerifySignature} 
            isLoading={isProcessing}
            disabled={!originalFile || !signatureFile || !publicKeyFile}
          >
            {isProcessing ? 'Doğrulanıyor...' : 'Doğrula'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Encryption modal
  const renderEncryptModal = () => (
    <Modal isOpen={showEncryptModal} onClose={() => setShowEncryptModal(false)} title="Dosya Şifrele">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Şifrelenecek Dosya
          </label>
          {fileToEncrypt ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{fileToEncrypt.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setFileToEncrypt(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('fileToEncrypt').click()}
            >
              Dosya Seç
            </Button>
          )}
          <input
            id="fileToEncrypt"
            type="file"
            className="hidden"
            onChange={(e) => setFileToEncrypt(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alıcının Açık Anahtarı (Public Key)
          </label>
          {encryptionPublicKeyFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{encryptionPublicKeyFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setEncryptionPublicKeyFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('encryptionPublicKeyFile').click()}
            >
              Açık Anahtar Seç
            </Button>
          )}
          <input
            id="encryptionPublicKeyFile"
            type="file"
            className="hidden"
            accept=".asc,.pgp,.gpg"
            onChange={(e) => setEncryptionPublicKeyFile(e.target.files[0])}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setShowEncryptModal(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleEncryptFile} 
            isLoading={isProcessing}
            disabled={!fileToEncrypt || !encryptionPublicKeyFile}
          >
            {isProcessing ? 'Şifreleniyor...' : 'Şifrele'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Decryption modal
  const renderDecryptModal = () => (
    <Modal isOpen={showDecryptModal} onClose={() => setShowDecryptModal(false)} title="Dosya Şifresini Çöz">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Şifreli Dosya (.pgp)
          </label>
          {fileToDecrypt ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{fileToDecrypt.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setFileToDecrypt(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('fileToDecrypt').click()}
            >
              Şifreli Dosya Seç
            </Button>
          )}
          <input
            id="fileToDecrypt"
            type="file"
            className="hidden"
            accept=".pgp,.asc,.gpg"
            onChange={(e) => setFileToDecrypt(e.target.files[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Özel Anahtarınız (Private Key)
          </label>
          {decryptionPrivateKeyFile ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{decryptionPrivateKeyFile.name}</span>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setDecryptionPrivateKeyFile(null)}>
                Değiştir
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => document.getElementById('decryptionPrivateKeyFile').click()}
            >
              Özel Anahtar Seç
            </Button>
          )}
          <input
            id="decryptionPrivateKeyFile"
            type="file"
            className="hidden"
            accept=".asc,.pgp,.gpg"
            onChange={(e) => setDecryptionPrivateKeyFile(e.target.files[0])}
          />
        </div>

        <Input
          label="Passphrase"
          type="password"
          placeholder="Özel anahtarınızın parolası"
          value={decryptionPassphrase}
          onChange={(e) => setDecryptionPassphrase(e.target.value)}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setShowDecryptModal(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleDecryptFile} 
            isLoading={isProcessing}
            disabled={!fileToDecrypt || !decryptionPrivateKeyFile || !decryptionPassphrase}
          >
            {isProcessing ? 'Şifre Çözülüyor...' : 'Şifreyi Çöz'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card 
        title="PGP Anahtar Çifti Oluştur"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
        description="Yeni bir PGP anahtar çifti oluşturun (Açık ve Özel Anahtar)"
        actionText="Anahtar Oluştur"
        onAction={() => setShowKeyGenModal(true)}
      />
      
      <Card 
        title="Dosya Şifrele"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        description="Alıcının açık anahtarıyla bir dosyayı şifreleyin"
        actionText="Dosya Şifrele"
        onAction={handleEncryptFileClick}
      />
      
      <Card 
        title="Dosya Şifresini Çöz"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        }
        description="Size gönderilen şifreli bir dosyayı özel anahtarınızla çözün"
        actionText="Şifre Çöz"
        onAction={handleDecryptFileClick}
      />
      
      <Card 
        title="Dosya İmzala"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
        description="Bir dosyayı özel anahtarınızla imzalayın"
        actionText="Dosya İmzala"
        onAction={handleSignFileClick}
      />
      
      <Card 
        title="İmza Doğrula"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        description="Bir dosya imzasının geçerliliğini doğrulayın"
        actionText="İmza Doğrula"
        onAction={handleVerifyClick}
      />

      {renderKeyGenModal()}
      {renderSigningModal()}
      {renderVerifyModal()}
      {renderEncryptModal()}
      {renderDecryptModal()}
    </div>
  );
};