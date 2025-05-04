import { useState } from 'react';
import * as openpgp from 'openpgp';
import { useNotification } from './useNotification';
import { useFileSelection } from './useFileSelection';

export const usePgp = () => {
  const { showNotification } = useNotification();
  const { handleFileSelection } = useFileSelection();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // PGP anahtar çifti oluşturma
  const generateKeyPair = async (name, email, passphrase) => {
    if (!name || !email || !passphrase) {
      showNotification('Lütfen tüm alanları doldurun', 'error');
      return null;
    }

    try {
      setIsGenerating(true);
      showNotification('Anahtar çifti oluşturuluyor...', 'info');

      const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name, email }],
        passphrase,
        format: 'armored'
      });

      setIsGenerating(false);
      showNotification('Anahtar çifti başarıyla oluşturuldu', 'success');

      return {
        privateKey,
        publicKey,
        revocationCertificate
      };
    } catch (error) {
      console.error('Anahtar oluşturma hatası:', error);
      setIsGenerating(false);
      showNotification(`Anahtar oluşturma hatası: ${error.message}`, 'error');
      return null;
    }
  };

  // Dosya imzalama
  const signFile = async (file, privateKeyFile, passphrase) => {
    try {
      setIsProcessing(true);
      showNotification('Dosya imzalanıyor...', 'info');

      // Orijinal dosya içeriğini oku
      const fileContent = await file.arrayBuffer();
      const fileData = new Uint8Array(fileContent);

      // Private key içeriğini oku
      const privateKeyContent = await privateKeyFile.text();
      
      // Private key'i decrypt et
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyContent }),
        passphrase
      });

      // İmzala
      const message = await openpgp.createMessage({ binary: fileData });
      const detachedSignature = await openpgp.sign({
        message,
        signingKeys: privateKey,
        detached: true
      });

      setIsProcessing(false);
      showNotification('Dosya başarıyla imzalandı', 'success');

      return {
        fileName: `${file.name}.sig`,
        content: detachedSignature
      };
    } catch (error) {
      console.error('Dosya imzalama hatası:', error);
      setIsProcessing(false);
      showNotification(`Dosya imzalama hatası: ${error.message}`, 'error');
      return null;
    }
  };


  const verifySignature = async (file, signatureFile, publicKeyFile) => {
    try {
      setIsProcessing(true);
      showNotification('İmza doğrulanıyor...', 'info');
  
      // Orijinal dosya içeriğini oku
      const fileContent = await file.arrayBuffer();
      const fileData = new Uint8Array(fileContent);
  
      // İmza dosyasını oku
      const signatureContent = await signatureFile.text();
  
      // Public key içeriğini oku
      const publicKeyContent = await publicKeyFile.text();
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyContent });
  
      // İmzayı doğrula
      const message = await openpgp.createMessage({ binary: fileData });
      const signature = await openpgp.readSignature({
        armoredSignature: signatureContent
      });
  
      const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: publicKey
      });
  
      const { verified, keyID } = verificationResult.signatures[0];
      
      try {
        await verified; // Geçersiz imzada hata fırlatır
        setIsProcessing(false);
        showNotification(`İmza geçerli! İmzalayan anahtar ID: ${keyID.toHex()}`, 'success');
        return { success: true, keyID: keyID.toHex() };
      } catch (e) {
        setIsProcessing(false);
        showNotification(`İmza geçerli değil: ${e.message}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('İmza doğrulama hatası:', error);
      setIsProcessing(false);
      showNotification(`İmza doğrulama hatası: ${error.message}`, 'error');
      return null;
    }
  };


  const encryptFile = async (file, publicKeyFile) => {
    try {
      setIsProcessing(true);
      showNotification('Dosya şifreleniyor...', 'info');
  
      // Dosya içeriğini oku
      const fileContent = await file.arrayBuffer();
      const fileData = new Uint8Array(fileContent);
  
      // Public key içeriğini oku
      const publicKeyContent = await publicKeyFile.text();
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyContent });
  
      // Şifrele
      const message = await openpgp.createMessage({ binary: fileData });
      const encrypted = await openpgp.encrypt({
        message,
        encryptionKeys: publicKey,
        format: 'binary'
      });
  
      setIsProcessing(false);
      showNotification('Dosya başarıyla şifrelendi', 'success');
  
      return {
        fileName: `${file.name}.pgp`,
        content: encrypted
      };
    } catch (error) {
      console.error('Dosya şifreleme hatası:', error);
      setIsProcessing(false);
      showNotification(`Dosya şifreleme hatası: ${error.message}`, 'error');
      return null;
    }
  };
  
  // Dosya şifresini çözme
  const decryptFile = async (encryptedFile, privateKeyFile, passphrase) => {
    try {
      setIsProcessing(true);
      showNotification('Dosya şifresi çözülüyor...', 'info');
  
      // Şifreli dosya içeriğini oku
      const encryptedContent = await encryptedFile.arrayBuffer();
      const encryptedData = new Uint8Array(encryptedContent);
  
      // Private key içeriğini oku
      const privateKeyContent = await privateKeyFile.text();
      
      // Private key'i decrypt et
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyContent }),
        passphrase
      });
  
      // Şifreyi çöz
      const message = await openpgp.readMessage({
        binaryMessage: encryptedData
      });
      
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'binary'
      });
  
      // Orjinal dosya adını al (varsa .pgp uzantısını kaldır)
      const originalFileName = encryptedFile.name.endsWith('.pgp') 
        ? encryptedFile.name.slice(0, -4) 
        : `decrypted_${encryptedFile.name}`;
  
      setIsProcessing(false);
      showNotification('Dosya şifresi başarıyla çözüldü', 'success');
  
      return {
        fileName: originalFileName,
        content: decrypted
      };
    } catch (error) {
      console.error('Dosya şifre çözme hatası:', error);
      setIsProcessing(false);
      showNotification(`Dosya şifre çözme hatası: ${error.message}`, 'error');
      return null;
    }
  };  


  // Yardımcı fonksiyonlar
  const downloadAsFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  

  return {
    generateKeyPair,
    signFile,
    verifySignature,
    encryptFile,
    decryptFile,
    downloadAsFile,
    isGenerating,
    isProcessing
  };
};

