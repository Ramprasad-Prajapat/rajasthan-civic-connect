import React from 'react';

/**
 * Animated Pulse Skeleton Shimmer Component
 */
export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '6px', className = '' }) => (
  <div
    className={`bg-slate-200 animate-pulse ${className}`}
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'pulseShimmer 1.5s infinite ease-in-out'
    }}
  />
);

export const SkeletonCard = () => (
  <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
    <div className="d-flex align-items-center mb-3">
      <SkeletonBox width="48px" height="48px" borderRadius="50%" className="me-3" />
      <div className="flex-grow-1">
        <SkeletonBox width="60%" height="18px" className="mb-2" />
        <SkeletonBox width="40%" height="14px" />
      </div>
    </div>
    <SkeletonBox width="100%" height="14px" className="mb-2" />
    <SkeletonBox width="90%" height="14px" className="mb-3" />
    <div className="d-flex justify-content-between align-items-center pt-2">
      <SkeletonBox width="80px" height="24px" borderRadius="12px" />
      <SkeletonBox width="100px" height="32px" borderRadius="20px" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="table-responsive bg-white rounded-4 border p-3">
    <div className="d-flex justify-content-between mb-3 px-2">
      <SkeletonBox width="200px" height="24px" />
      <SkeletonBox width="120px" height="32px" borderRadius="20px" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="d-flex align-items-center py-3 border-bottom px-2">
        <SkeletonBox width="30px" height="30px" borderRadius="50%" className="me-3" />
        <SkeletonBox width="25%" height="16px" className="me-auto" />
        <SkeletonBox width="15%" height="16px" className="me-3" />
        <SkeletonBox width="15%" height="16px" className="me-3" />
        <SkeletonBox width="80px" height="24px" borderRadius="12px" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="container py-4">
    <div className="row g-3 mb-4">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <SkeletonBox width="40%" height="14px" className="mb-2" />
            <SkeletonBox width="60%" height="28px" className="mb-2" />
            <SkeletonBox width="80%" height="12px" />
          </div>
        </div>
      ))}
    </div>
    <div className="row g-4">
      <div className="col-12 col-lg-8">
        <SkeletonTable rows={4} />
      </div>
      <div className="col-12 col-lg-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </div>
);

export const SkeletonPage = () => (
  <div className="min-vh-50 d-flex flex-column justify-content-center align-items-center py-5">
    <style>{`
      @keyframes pulseShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    <div className="w-100 max-w-1000 px-3">
      <SkeletonBox width="250px" height="32px" className="mb-3 mx-auto" />
      <SkeletonBox width="400px" height="18px" className="mb-5 mx-auto" />
      <SkeletonDashboard />
    </div>
  </div>
);

export default SkeletonPage;
