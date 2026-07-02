using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace AcademyHub.Infrastructure.Services
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }

    public class EncryptionService : IEncryptionService
    {
        private readonly string _encryptionKey;

        public EncryptionService(string encryptionKey)
        {
            _encryptionKey = encryptionKey;
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using (Aes aes = Aes.Create())
            {
                var keyBytes = Encoding.UTF8.GetBytes(_encryptionKey.PadRight(32).Substring(0, 32));
                aes.Key = keyBytes;
                aes.GenerateIV();

                using (var encryptor = aes.CreateEncryptor())
                using (var ms = new MemoryStream())
                {
                    ms.Write(aes.IV, 0, aes.IV.Length);
                    using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    using (var sw = new StreamWriter(cs))
                    {
                        sw.Write(plainText);
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            try
            {
                var fullCipher = Convert.FromBase64String(cipherText);
                using (Aes aes = Aes.Create())
                {
                    var keyBytes = Encoding.UTF8.GetBytes(_encryptionKey.PadRight(32).Substring(0, 32));
                    aes.Key = keyBytes;

                    var iv = new byte[aes.BlockSize / 8];
                    var cipher = new byte[fullCipher.Length - iv.Length];

                    Array.Copy(fullCipher, 0, iv, 0, iv.Length);
                    Array.Copy(fullCipher, iv.Length, cipher, 0, cipher.Length);

                    aes.IV = iv;

                    using (var decryptor = aes.CreateDecryptor())
                    using (var ms = new MemoryStream(cipher))
                    using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                    using (var sr = new StreamReader(cs))
                    {
                        return sr.ReadToEnd();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ŞİFRE ÇÖZÜLEMEDİ: {ex.Message}");
                Console.WriteLine($"❌ CipherText: {cipherText}");
                throw new Exception($"Şifre çözülemedi: {ex.Message}", ex);
            }
        }
    }
}