import React, { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { getPosts, createPost } from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      // Ensure data is an array
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Don't set fallback data in production - let user know there's an issue
      if (error.message === 'Network Error') {
        alert('Cannot connect to server. Please check if the backend is running.');
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await createPost(postData);
      // Ensure posts is an array before spreading
      setPosts([newPost, ...(Array.isArray(posts) ? posts : [])]);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else if (error.message === 'Network Error') {
        alert('Cannot connect to server. Please check if the backend is running.');
      } else {
        alert('Failed to create post. Please try again.');
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div className="main-content">
      <div className="posts-container">
        <PostForm onSubmit={handleCreatePost} />
        <div>
          {Array.isArray(posts) && posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          {(!posts || posts.length === 0) && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No posts yet. Be the first to share something!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;