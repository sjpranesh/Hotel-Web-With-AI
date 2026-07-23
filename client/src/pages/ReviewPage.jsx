import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Upload } from 'lucide-react';
import { useHotel } from '../context/HotelContext';

const ReviewPage = () => {
  const [ratings, setRatings] = useState({
    foodQuality: 0,
    taste: 0,
    service: 0,
    cleanliness: 0,
    ambience: 0,
    overall: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { tableNumber, API_URL } = useHotel();
  const navigate = useNavigate();

  const handleRating = (key, value) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const submitReview = async () => {
    if (ratings.overall === 0) {
      alert('Please provide an overall rating');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          ...ratings,
          comment
        })
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingRow = ({ label, stateKey }) => (
    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 mb-3 glass-card">
      <span className="font-outfit text-white/90 text-sm">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            onClick={() => handleRating(stateKey, star)}
            className={`cursor-pointer transition-all ${
              ratings[stateKey] >= star ? 'text-hotel-gold fill-hotel-gold scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'text-gray-600 hover:text-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-6 text-center" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #2a2a2a, #111111)' }}>
        <CheckCircle size={80} className="text-hotel-gold mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
        <h1 className="text-4xl font-playfair text-white mb-4">Thank You!</h1>
        <p className="text-gray-400 font-outfit mb-8 max-w-sm">Your feedback helps us maintain our five-star luxury standards. We hope to see you again soon.</p>
        <button 
          onClick={() => {
            localStorage.removeItem('quickserve_table');
            navigate('/');
          }}
          className="bg-hotel-gold text-black font-bold font-outfit px-10 py-4 rounded-full uppercase tracking-widest hover:bg-[#b8952a] transition-all luxury-shadow"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] py-10 px-4 md:px-0 text-white font-outfit" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #2a2a2a, #111111)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gradient-gold mb-3">Rate Your Experience</h1>
          <p className="text-gray-400">We value your feedback to perfect our culinary journey.</p>
        </div>

        <div className="glass-panel-dark rounded-[2.5rem] p-6 md:p-10 border border-white/5 luxury-shadow">
          <div className="space-y-1 mb-8">
            <RatingRow label="Food Quality" stateKey="foodQuality" />
            <RatingRow label="Taste" stateKey="taste" />
            <RatingRow label="Service" stateKey="service" />
            <RatingRow label="Cleanliness" stateKey="cleanliness" />
            <RatingRow label="Ambience" stateKey="ambience" />
          </div>

          <div className="mb-8 p-6 bg-gradient-to-b from-hotel-gold/10 to-transparent border border-hotel-gold/20 rounded-2xl text-center">
             <h3 className="text-lg font-playfair text-hotel-gold mb-4">Overall Experience *</h3>
             <div className="flex justify-center gap-4">
               {[1, 2, 3, 4, 5].map((star) => (
                 <Star
                   key={star}
                   size={40}
                   onClick={() => handleRating('overall', star)}
                   className={`cursor-pointer transition-all ${
                     ratings.overall >= star ? 'text-hotel-gold fill-hotel-gold scale-110 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]' : 'text-gray-600 hover:text-gray-400'
                   }`}
                 />
               ))}
             </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-400 text-sm mb-3">Additional Comments (Optional)</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-hotel-gold/50 transition-colors h-32 resize-none"
              placeholder="Tell us about the amazing service or very tasty biryani..."
            />
          </div>

          <button 
            onClick={submitReview}
            disabled={isSubmitting}
            className="w-full bg-hotel-gold text-black font-bold py-4 rounded-full uppercase tracking-widest hover:bg-[#b8952a] active:scale-95 transition-all outline-none disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
