import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, Upload, Library } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

interface Photo {
  id: string;
  storage_path: string;
}

export default function SubmitStory() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Photo attachment state
  const [attachmentType, setAttachmentType] = useState<'none' | 'upload' | 'gallery'>('none');
  const [file, setFile] = useState<File | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [selectedPhotoPath, setSelectedPhotoPath] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Cooldown check
  useEffect(() => {
    const lastSub = localStorage.getItem('last_story_submission');
    if (lastSub) {
      const diff = Date.now() - parseInt(lastSub);
      if (diff < 15 * 1000) {
        setError(`Please wait ${Math.ceil((15 * 1000 - diff) / 1000)} seconds before submitting another story.`);
      }
    }
  }, []);

  useEffect(() => {
    if (attachmentType === 'gallery') {
      fetchGalleryPhotos();
    }
  }, [attachmentType]);

  const fetchGalleryPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('id, storage_path')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });
    if (data) setGalleryPhotos(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    const lastSub = localStorage.getItem('last_story_submission');
    if (lastSub && Date.now() - parseInt(lastSub) < 15 * 1000) {
      setError('Please wait before submitting again.');
      return;
    }

    setSubmitting(true);
    setError('');

    let attachedPhotoPath = null;

    try {
      // Handle "Upload New" photo
      if (attachmentType === 'upload' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `pending/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pending-photos')
          .upload(filePath, file);

        if (uploadError) throw new Error('Failed to upload photo.');
        
        attachedPhotoPath = filePath;
      } 
      // Handle "Choose from Gallery"
      else if (attachmentType === 'gallery' && selectedPhotoPath) {
        attachedPhotoPath = selectedPhotoPath;
      }

      // Invoke Edge function instead of direct insert
      const { data, error: funcError } = await supabase.functions.invoke('submit-submission', {
        body: {
          type: 'story',
          turnstileToken,
          payload: {
            name: formData.name,
            email: formData.email,
            content: formData.content,
            attached_photo_path: attachedPhotoPath
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
      if (data?.error) throw new Error(data.error || 'There was an error submitting your story.');
      
      localStorage.setItem('last_story_submission', Date.now().toString());
      
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
        <p className="mt-4 mb-8">Your story has been submitted and is pending review.</p>
        <button onClick={() => navigate('/stories')} className="btn btn-primary">
          Return to Stories
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Share a Memory</h1>
        <p className="page-subtitle">We would love to hear your stories and memories.</p>
      </div>

      <div className="card surface" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
            <label className="form-label" htmlFor="email">Email Address (Optional, for contact only)</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="content">Your Story or Condolence</label>
            <textarea
              id="content"
              required
              className="form-textarea"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label mb-2">Attach a Photo (Optional)</label>
            <div className="flex gap-4 mb-4">
              <button 
                type="button"
                onClick={() => setAttachmentType('none')}
                className={`btn ${attachmentType === 'none' ? 'btn-primary' : 'btn-outline'}`}
              >
                No Photo
              </button>
              <button 
                type="button"
                onClick={() => setAttachmentType('upload')}
                className={`btn ${attachmentType === 'upload' ? 'btn-primary' : 'btn-outline'}`}
              >
                <Upload size={16} /> Upload New
              </button>
              <button 
                type="button"
                onClick={() => setAttachmentType('gallery')}
                className={`btn ${attachmentType === 'gallery' ? 'btn-primary' : 'btn-outline'}`}
              >
                <Library size={16} /> Choose from Gallery
              </button>
            </div>

            {attachmentType === 'upload' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded mt-2" style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-gray-500 mt-2" style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#64748b' }}>
                  This photo will also be submitted to the gallery for approval.
                </p>
              </div>
            )}

            {attachmentType === 'gallery' && (
              <div className="mt-4">
                {galleryPhotos.length === 0 ? (
                  <p className="text-gray-500 italic">No gallery photos available yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2" style={{ gap: '0.5rem' }}>
                    {galleryPhotos.map((photo) => (
                      <div 
                        key={photo.id}
                        onClick={() => setSelectedPhotoPath(photo.storage_path)}
                        style={{
                          cursor: 'pointer',
                          border: selectedPhotoPath === photo.storage_path ? '3px solid var(--color-accent-river)' : '2px solid transparent',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={getPhotoUrl(photo.storage_path)} 
                          className="w-full h-24 object-cover" 
                          style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                          alt="Gallery selection"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group mt-6 flex justify-center">
            {/* The SiteKey here needs to be replaced with your actual Cloudflare Turnstile Site Key */}
            <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={setTurnstileToken} />
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Story'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/stories')} 
              className="btn btn-outline"
              style={{ marginLeft: '1rem', marginTop: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
