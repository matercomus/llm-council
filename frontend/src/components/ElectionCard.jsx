import React, { useState } from 'react';
import './ElectionCard.css';

function getModelLogoUrl(modelName) {
  if (!modelName) return null;
  const provider = modelName.split('/')[0];
  // Map common providers to models.dev slugs if needed
  const providerMap = {
    'openai': 'openai',
    'anthropic': 'anthropic',
    'google': 'google',
    'meta-llama': 'meta',
    'mistralai': 'mistral',
    'x-ai': 'xai' // Assuming x-ai maps to xai, verify if needed
  };
  
  const slug = providerMap[provider] || provider;
  return `https://models.dev/logos/${slug}.svg`;
}

export default function ElectionCard({ rank, model, score, voteDistribution, totalVotes, voters }) {
  const [expanded, setExpanded] = useState(false);
  const modelName = model.split('/')[1] || model;
  const logoUrl = getModelLogoUrl(model);

  // Calculate percentages for the bar
  const getPercent = (count) => (count / totalVotes) * 100;
  
  const isLegacy = !voteDistribution;
  const hasTop3Votes = !isLegacy && (voteDistribution['1st'] > 0 || voteDistribution['2nd'] > 0 || voteDistribution['3rd'] > 0);

  return (
    <div 
      className={`election-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="card-header">
        <div className={`rank-badge rank-${rank}`}>
          #{rank}
        </div>
        
        <div className="model-info">
          <img 
            src={logoUrl} 
            alt="" 
            className="model-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="model-name">{modelName}</span>
        </div>

        <div className="score-badge" title="(Lower is better)">
          Avg Rank: {score.toFixed(2)}
        </div>
      </div>

      <div className="vote-bar">
        {isLegacy ? (
          <div 
            className="vote-segment other" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}
            title="Detailed vote distribution not available for this conversation"
          >
            Legacy Data
          </div>
        ) : !hasTop3Votes ? (
          <div 
            className="vote-segment other" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}
            title="Model received votes but none in top 3"
          >
            No Top 3 Votes
          </div>
        ) : (
          <>
            {voteDistribution['1st'] > 0 && (
              <div 
                className="vote-segment first" 
                style={{ width: `${getPercent(voteDistribution['1st'])}%` }}
                title={`${voteDistribution['1st']} votes for 1st place`}
              />
            )}
            {voteDistribution['2nd'] > 0 && (
              <div 
                className="vote-segment second" 
                style={{ width: `${getPercent(voteDistribution['2nd'])}%` }}
                title={`${voteDistribution['2nd']} votes for 2nd place`}
              />
            )}
            {voteDistribution['3rd'] > 0 && (
              <div 
                className="vote-segment third" 
                style={{ width: `${getPercent(voteDistribution['3rd'])}%` }}
                title={`${voteDistribution['3rd']} votes for 3rd place`}
              />
            )}
          </>
        )}
      </div>

      {expanded && (
        <div className="card-details">
          <div className="voter-breakdown">
            <small>Vote Breakdown:</small>
            <div className="voter-list">
              {/* We'll need to pass the actual voters list here in a future iteration */}
              <span className="voter-chip rank-1">{voteDistribution['1st']} x 1st Place</span>
              <span className="voter-chip">{voteDistribution['2nd']} x 2nd Place</span>
              <span className="voter-chip">{voteDistribution['3rd']} x 3rd Place</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
