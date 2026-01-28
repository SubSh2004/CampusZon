// campuszon-client/src/components/OptimizationStatus.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OptimizationStatusProps {
  itemId: string;
  initialStatus?: string;
}

const OptimizationStatus: React.FC<OptimizationStatusProps> = ({ 
  itemId, 
  initialStatus = 'pending' 
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'pending') {
      // Poll for status updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/items/${itemId}/optimization-status`);
          const newStatus = response.data.status;
          
          setStatus(newStatus);
          
          // Stop polling when completed or failed
          if (newStatus === 'completed' || newStatus === 'failed') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Failed to check optimization status:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [itemId, status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Optimizing images...</span>
          </div>
        );
      
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">HD images ready</span>
          </div>
        );
      
      case 'failed':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Using original images</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="optimization-status">
      {getStatusDisplay()}
    </div>
  );
};

export default OptimizationStatus;