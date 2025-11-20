import React, { useState } from 'react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const RatingForm = ({ taskId, toUserId, onSuccess, onCancel }) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/ratings', {
        toUser: toUserId,
        taskId,
        score,
        comment,
      });
      showToast('Rating submitted successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rating-form">
      <h3>Rate User</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating</label>
          <StarRating rating={score} onRatingChange={setScore} />
        </div>
        <div className="form-group">
          <label>Comment (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows="4"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const UserProfile = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, ratingsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/ratings/user/${userId}`),
      ]);
      setProfile(profileRes.data);
      setRatings(ratingsRes.data);
    } catch (error) {
      showToast('Failed to load user profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error-message">User not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.firstName[0]}{profile.lastName[0]}
        </div>
        <div className="profile-info">
          <h3>{profile.firstName} {profile.lastName}</h3>
          <p className="profile-role">{profile.role}</p>
          {profile.role === 'student' && profile.university && (
            <p className="profile-university">{profile.university}</p>
          )}
          {profile.role === 'vendor' && profile.businessName && (
            <p className="profile-business">{profile.businessName}</p>
          )}
        </div>
      </div>

      <div className="profile-rating">
        <div className="rating-summary">
          <StarRating rating={profile.averageRating || 0} readonly />
          <span className="rating-text">
            {profile.averageRating ? profile.averageRating.toFixed(1) : 'No ratings yet'}
          </span>
          <span className="rating-count">
            ({profile.totalRatings || 0} {profile.totalRatings === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      </div>

      {ratings.length > 0 && (
        <div className="ratings-list">
          <h4>Recent Ratings</h4>
          {ratings.map((rating) => (
            <div key={rating._id} className="rating-item">
              <div className="rating-header">
                <StarRating rating={rating.score} readonly />
                <span className="rating-date">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </span>
              </div>
              {rating.comment && (
                <p className="rating-comment">{rating.comment}</p>
              )}
              <p className="rating-from">
                From: {rating.fromUser?.firstName} {rating.fromUser?.lastName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { StarRating, RatingForm, UserProfile };
