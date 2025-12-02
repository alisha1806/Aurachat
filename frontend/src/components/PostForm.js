import React, { useState } from 'react';

const PostForm = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      alert('Please enter some content for your post.');
      return;
    }
    
    if (trimmedContent.length > 1000) {
      alert('Post content must be less than 1000 characters.');
      return;
    }
    
    // Validate image URL if provided
    if (image.trim() && !isValidUrl(image.trim())) {
      alert('Please enter a valid image URL.');
      return;
    }
    
    onSubmit({ 
      content: trimmedContent, 
      image: image.trim() || null 
    });
    setContent('');
    setImage('');
  };
  
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="post-form">
      <h3>What's on your mind?</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            required
            maxLength={1000}
          />
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'right', marginTop: '4px' }}>
            {content.length}/1000 characters
          </div>
        </div>
        <div className="form-group">
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL (optional)"
          />
        </div>
        <button type="submit" className="btn">Post</button>
      </form>
    </div>
  );
};

export default PostForm;