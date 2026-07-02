import React, { useState } from 'react';
import { FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { certificateApi } from '../../api/api';

const CertificateVerify = () => {
    const [certNumber, setCertNumber] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!certNumber.trim()) return;

        try {
            setLoading(true);
            const res = await certificateApi.verifyCertificate(certNumber.trim());
            setResult(res.data);
        } catch (err) {
            console.error('Doğrulama hatası:', err);
            setResult({ success: false, message: 'Doğrulama sırasında bir hata oluştu' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="certificate-verify-container">
            <h1>🔍 Sertifika Doğrulama</h1>
            <p>Sertifika numarasını girerek doğrulayın</p>

            <div className="verify-form">
                <input
                    type="text"
                    placeholder="Sertifika numarasını girin (örn: AH-20250630-12345)"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                />
                <button onClick={handleVerify} disabled={loading}>
                    {loading ? 'Doğrulanıyor...' : <><FaSearch /> Doğrula</>}
                </button>
            </div>

            {result && (
                <div className={`verify-result ${result.data?.isValid ? 'valid' : 'invalid'}`}>
                    {result.data?.isValid ? (
                        <>
                            <FaCheckCircle className="result-icon valid" />
                            <h3>✅ Sertifika Geçerli</h3>
                            <p>Bu sertifika geçerli ve doğrulanmıştır.</p>
                        </>
                    ) : (
                        <>
                            <FaTimesCircle className="result-icon invalid" />
                            <h3>❌ Sertifika Geçersiz</h3>
                            <p>{result.message || 'Bu sertifika bulunamadı veya geçersiz.'}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificateVerify;