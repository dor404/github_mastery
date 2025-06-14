import { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Badge {
  _id: string;
  name: string;
  description: string;
  type: 'exercise' | 'tutorial' | 'quiz' | 'completion' | 'milestone';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  earnedAt?: Date;
}

interface BadgeCheckResponse {
  message: string;
  newBadges: Badge[];
}

export const useBadges = () => {
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkForNewBadges = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/badges/check-badges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: BadgeCheckResponse = await response.json();
        
        if (data.newBadges && data.newBadges.length > 0) {
          setNewBadges(data.newBadges);
          setShowNotification(true);
        }
        
        return data.newBadges;
      }
    } catch (error) {
      console.error('Error checking for new badges:', error);
    } finally {
      setLoading(false);
    }
    
    return [];
  }, []);

  const hideNotification = useCallback(() => {
    setShowNotification(false);
    setNewBadges([]);
  }, []);

  const getUserBadges = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/badges/my-badges`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const badges = await response.json();
        return badges;
      }
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
    
    return [];
  }, []);

  return {
    newBadges,
    showNotification,
    loading,
    checkForNewBadges,
    hideNotification,
    getUserBadges
  };
};

export default useBadges; 