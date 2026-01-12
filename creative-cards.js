dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });

function drawViz(data) {
  const vizContainer = document.getElementById('viz-container');
  if (!vizContainer) {
    const container = document.createElement('div');
    container.id = 'viz-container';
    document.body.appendChild(container);
  }
  
  document.getElementById('viz-container').innerHTML = '';
  
  const styleConfig = data.style;
  const tables = data.tables.DEFAULT;
  
  if (!tables || tables.length === 0) {
    renderEmptyState();
    return;
  }
  
  applyCustomStyles(styleConfig);
  renderCards(tables, styleConfig, data.fields);
}

function applyCustomStyles(styleConfig) {
  const root = document.documentElement;
  
  root.style.setProperty('--columns', styleConfig.columns || '4');
  root.style.setProperty('--card-spacing', (styleConfig.cardSpacing || '16') + 'px');
  root.style.setProperty('--border-radius', (styleConfig.borderRadius || '12') + 'px');
  root.style.setProperty('--image-height', (styleConfig.imageHeight || '200') + 'px');
  
  root.style.setProperty('--primary-color', styleConfig.primaryColor?.color || '#E31837');
  root.style.setProperty('--bg-color', styleConfig.backgroundColor?.color || '#FFFFFF');
  root.style.setProperty('--text-color', styleConfig.textColor?.color || '#1A1A1A');
  root.style.setProperty('--metric-bg', styleConfig.metricBackground?.color || '#F8FAFC');
  
  if (styleConfig.showShadow) {
    root.style.setProperty('--card-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--card-shadow-hover', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');
  } else {
    root.style.setProperty('--card-shadow', 'none');
    root.style.setProperty('--card-shadow-hover', 'none');
  }
}

function renderCards(tables, styleConfig, fields) {
  const container = document.getElementById('viz-container');
  const grid = document.createElement('div');
  grid.className = 'creative-cards-grid';
  
  tables.forEach((row, index) => {
    const card = createCard(row, styleConfig, fields, index);
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
}

function createCard(row, styleConfig, fields, index) {
  const card = document.createElement('div');
  card.className = 'creative-card';
  
  const imageUrl = getFieldValue(row, fields, 'imageUrl');
  if (imageUrl) {
    const imageSection = document.createElement('div');
    imageSection.className = 'card-image';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = getFieldValue(row, fields, 'creativeName') || 'Creative';
    img.onerror = function() {
      this.src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop';
    };
    
    imageSection.appendChild(img);
    
    const badges = createBadges(row, fields, styleConfig);
    if (badges) {
      imageSection.appendChild(badges);
    }
    
    card.appendChild(imageSection);
  }
  
  const content = document.createElement('div');
  content.className = 'card-content';
  
  if (styleConfig.showDimensions !== false) {
    const dimensions = createDimensionsSection(row, fields);
    if (dimensions) {
      content.appendChild(dimensions);
    }
  }
  
  if (styleConfig.showMetrics !== false) {
    const metrics = createMetricsSection(row, fields, styleConfig);
    if (metrics) {
      content.appendChild(metrics);
    }
  }
  
  card.appendChild(content);
  
  card.addEventListener('click', function() {
    dscc.sendInteraction('onClick', {
      data: row,
      index: index
    });
  });
  
  return card;
}

function createBadges(row, fields, styleConfig) {
  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'card-badges';
  
  const creativeType = getFieldValue(row, fields, 'creativeType');
  if (creativeType) {
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge-type';
    typeBadge.textContent = creativeType;
    badgeContainer.appendChild(typeBadge);
  }
  
  const status = getFieldValue(row, fields, 'status');
  if (status) {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-status badge-' + status.toLowerCase();
    statusBadge.textContent = status;
    badgeContainer.appendChild(statusBadge);
  }
  
  return badgeContainer.children.length > 0 ? badgeContainer : null;
}

function createDimensionsSection(row, fields) {
  const section = document.createElement('div');
  section.className = 'dimensions-section';
  
  const creativeName = getFieldValue(row, fields, 'creativeName');
  if (creativeName) {
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = creativeName;
    section.appendChild(title);
  }
  
  const campaignGroup = getFieldValue(row, fields, 'campaignGroup');
  const channel = getFieldValue(row, fields, 'channel');
  
  if (campaignGroup || channel) {
    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    const parts = [];
    if (campaignGroup) parts.push(campaignGroup);
    if (channel) parts.push(channel);
    subtitle.textContent = parts.join(' • ');
    section.appendChild(subtitle);
  }
  
  return section.children.length > 0 ? section : null;
}

function createMetricsSection(row, fields, styleConfig) {
  const section = document.createElement('div');
  section.className = 'metrics-section';
  
  const layout = styleConfig.metricsLayout || 'grid';
  section.classList.add('metrics-' + layout);
  
  const metrics = [
    { field: 'impressions', label: 'Impressions', icon: '👁️', format: 'number' },
    { field: 'clicks', label: 'Clicks', icon: '🖱️', format: 'number' },
    { field: 'spend', label: 'Spend', icon: '💰', format: 'currency' },
    { field: 'ctr', label: 'CTR', icon: '📈', format: 'percentage' }
  ];
  
  metrics.forEach(metric => {
    const value = getFieldValue(row, fields, metric.field);
    if (value !== null && value !== undefined) {
      const metricCard = document.createElement('div');
      metricCard.className = 'metric-card';
      
      const metricLabel = document.createElement('div');
      metricLabel.className = 'metric-label';
      metricLabel.innerHTML = `<span class="metric-icon">${metric.icon}</span> ${metric.label}`;
      
      const metricValue = document.createElement('div');
      metricValue.className = 'metric-value';
      metricValue.textContent = formatValue(value, metric.format);
      
      metricCard.appendChild(metricLabel);
      metricCard.appendChild(metricValue);
      section.appendChild(metricCard);
    }
  });
  
  return section.children.length > 0 ? section : null;
}

function getFieldValue(row, fields, fieldId) {
  const fieldConfig = fields[fieldId];
  if (!fieldConfig || fieldConfig.length === 0) return null;
  
  const fieldName = fieldConfig[0].name;
  return row[fieldName];
}

function formatValue(value, format) {
  if (value === null || value === undefined) return '—';
  
  switch (format) {
    case 'currency':
      return '$' + Number(value).toLocaleString('en-AU', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      });
    case 'percentage':
      return Number(value).toFixed(2) + '%';
    case 'number':
      return Number(value).toLocaleString('en-AU');
    default:
      return String(value);
  }
}

function renderEmptyState() {
  const container = document.getElementById('viz-container');
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
    <div class="empty-icon">📊</div>
    <h3>No Data Available</h3>
    <p>Please add data fields to the visualization configuration</p>
  `;
  container.appendChild(emptyState);
}
