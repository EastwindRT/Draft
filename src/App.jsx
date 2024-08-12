import React from 'react';
import FantasyBidApp from './FantasyBidApp';
import ErrorBoundary from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <FantasyBidApp />
      </div>
    </ErrorBoundary>
  );
}