// src/hooks/usePgp.js

import React from 'react';
import * as openpgp from 'openpgp';
import { useFileSelection } from './useFileSelection';
import { useNotification } from '../contexts/NotificationContext';

export const usePgp = () => {
  const { handleFileSelection } = useFileSelection();
  const { showNotification } = useNotification();

  // Binary dosyaları Uint8Array olarak oku
  const readFileAsBinary = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Text dosyaları (key dosyaları) string olarak oku
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleSignFile = async () => {
    try {
      // Step 1: Select file to sign
      const fileToSign = await new Promise((resolve) => {
        handleFileSelection('*.*', resolve);
      });

      // Step 2: Select private key
      const privateKeyFile = await new Promise((resolve) => {
        handleFileSelection('.key', resolve);
      });

      // Step 3: Get passphrase
      const passphrase = prompt('Enter private key passphrase:');
      
      if (!passphrase) {
        showNotification('Passphrase is required', 'error');
        return;
      }

      // Read files - dosyayı binary olarak oku, key'i text olarak oku
      const fileContent = await readFileAsBinary(fileToSign);
      const privateKeyContent = await readFileAsText(privateKeyFile);

      // Decrypt private key
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyContent }),
        passphrase: passphrase
      });

      // Create signature - binary dosya için createMessage({ binary: ... }) kullan
      const message = await openpgp.createMessage({ binary: fileContent });
      const detachedSignature = await openpgp.sign({
        message,
        signingKeys: privateKey,
        detached: true,
        format: 'armored' // Imzayı armored format olarak al
      });

      // Download signature file
      downloadKey(detachedSignature, `${fileToSign.name}.sig`);
      
      showNotification('File signed successfully', 'success');
    } catch (error) {
      console.error('Error signing file:', error);
      showNotification('Error signing file: ' + error.message, 'error');
    }
  };

  const handleVerifySignature = async () => {
    try {
      // Step 1: Select original file
      const originalFile = await new Promise((resolve) => {
        handleFileSelection('*.*', resolve);
      });

      // Step 2: Select signature file
      const signatureFile = await new Promise((resolve) => {
        handleFileSelection('.sig', resolve);
      });

      // Step 3: Select public key
      const publicKeyFile = await new Promise((resolve) => {
        handleFileSelection('.key', resolve);
      });

      // Read files
      const fileContent = await readFileAsBinary(originalFile);
      const signatureContent = await readFileAsText(signatureFile);
      const publicKeyContent = await readFileAsText(publicKeyFile);

      // Parse keys and message
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyContent });
      const message = await openpgp.createMessage({ binary: fileContent });
      const signature = await openpgp.readSignature({ armoredSignature: signatureContent });

      // Verify signature
      const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: publicKey
      });

      const { verified } = verificationResult.signatures[0];
      
      // Signature verification
      try {
        await verified; // throws on invalid signature
        showNotification('Signature is valid!', 'success');
      } catch (e) {
        showNotification('Invalid signature: ' + e.message, 'error');
      }
      
    } catch (error) {
      console.error('Error verifying signature:', error);
      showNotification('Error verifying signature: ' + error.message, 'error');
    }
  };

  const handleGenerateKeyPair = async () => {
    // Modal açma ve form değerleri
    const userName = prompt('Enter your name:');
    const userEmail = prompt('Enter your email:');
    const passphrase = prompt('Enter passphrase:');
    
    if (!userName || !userEmail || !passphrase) {
      showNotification('Please provide all required information', 'error');
      return;
    }

    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'ecc', 
        curve: 'curve25519',
        userIDs: [{ name: userName, email: userEmail }],
        passphrase: passphrase,
        format: 'armored'
      });

      // Download keys
      downloadKey(privateKey, `${userEmail}_private.key`);
      downloadKey(publicKey, `${userEmail}_public.key`);
      
      showNotification('Key pair generated successfully', 'success');
    } catch (error) {
      console.error('Error generating keys:', error);
      showNotification('Error generating key pair: ' + error.message, 'error');
    }
  };

  const downloadKey = (keyContent, fileName) => {
    const blob = new Blob([keyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { handleGenerateKeyPair, handleSignFile, handleVerifySignature };
};