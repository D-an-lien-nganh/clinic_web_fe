import { useState, useEffect } from 'react';

export const useWindowSize = () => {
    // Khởi tạo state với giá trị mặc định
    const [size, setSize] = useState([0, 0]);
  
    useEffect(() => {
      const handleResize = () => {
        setSize([window.innerWidth, window.innerHeight]);
      };
  
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        
        // Cập nhật kích thước ban đầu
        handleResize();
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResize);
        }
      };
    }, []);
  
    return size;
  };