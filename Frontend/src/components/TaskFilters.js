import React from 'react';

const TaskFilters = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="task-filters">
      <div className="filter-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={filters.location || ''}
          onChange={handleChange}
          placeholder="Filter by location"
        />
      </div>
      <div className="filter-group">
        <label htmlFor="minReward">Min Reward (KSh)</label>
        <input
          type="number"
          id="minReward"
          name="minReward"
          value={filters.minReward || ''}
          onChange={handleChange}
          placeholder="0"
        />
      </div>
      <div className="filter-group">
        <label htmlFor="maxTime">Max Time (min)</label>
        <input
          type="number"
          id="maxTime"
          name="maxTime"
          value={filters.maxTime || ''}
          onChange={handleChange}
          placeholder="Any"
        />
      </div>
    </div>
  );
};

export default TaskFilters;
