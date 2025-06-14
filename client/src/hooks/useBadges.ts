import { useState, useCallback } from 'react';

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
      
      const response = await fetch('http://localhost:5001/api/badges/check-badges', {
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
      
      const response = await fetch('http://localhost:5001/api/badges/my-badges', {
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