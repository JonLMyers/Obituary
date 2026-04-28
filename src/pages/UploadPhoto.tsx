import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function UploadPhoto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', caption: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Cooldown check
  useEffect(() => {
    const lastSub = localStorage.getItem('last_photo_submission');
    if (lastSub) {
      const diff = Date.now() - parseInt(lastSub);
      if (diff < 15 * 1000) {
        setError(`Please wait ${Math.ceil((15 * 1000 - diff) / 1000)} seconds before uploading another photo.`);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a photo to upload.');
      return;
    }
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    const lastSub = localStorage.getItem('last_photo_submission');
    if (lastSub && Date.now() - parseInt(lastSub) < 15 * 1000) {
      setError('Please wait before submitting again.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      // 1. Upload to Supabase Storage (pending folder)
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `pending/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pending-photos')
        .upload(filePath, file);

      if (uploadError) throw new Error('Error uploading photo. Please try again.');

      // 2. Insert metadata into photos table via Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('submit-submission', {
        body: {
          type: 'photo',
          turnstileToken,
          payload: {
            name: formData.name,
            caption: formData.caption,
            storage_path: filePath
          }
        }
      });

      if (funcError) {
        let errMsg = funcError.message;
        if (funcError.context) {
          try {
            const errResp = await funcError.context.json();
            if (errResp.error) errMsg = errResp.error;
          } catch (_) {}
        }
        throw new Error(errMsg);
      }
      if (data?.error) throw new Error(data.error || 'Error saving photo details.');

      localStorage.setItem('last_photo_submission', Date.now().toString());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in text-center mt-8">
        <CheckCircle size={48} color="var(--color-accent-sage)" className="mb-4 mx-auto" />
        <h2>Thank You</h2>
        <p className="mt-4 mb-8">Your photo has been uploaded and is pending review.</p>
        <button onClick={() => navigate('/gallery')} className="btn btn-primary">
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upload a Photo</h1>
        <p className="page-subtitle">Share your favorite moments with us.</p>
      </div>

      <div className="card surface" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="photo">Select Photo</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              style={{ display: 'block', marginBottom: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="caption">Caption (Optional)</label>
            <input
              id="caption"
              type="text"
              className="form-input"
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            />
          </div>

          <div className="form-group mt-6 flex justify-center">
            {/* The SiteKey here needs to be replaced with your actual Cloudflare Turnstile Site Key */}
            <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={setTurnstileToken} />
          </div>

          <div className="mt-8">
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Uploading...' : 'Upload Photo'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/gallery')} 
              className="btn btn-outline"
              style={{ marginLeft: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
