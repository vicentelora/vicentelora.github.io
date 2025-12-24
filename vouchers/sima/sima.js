let clickCount = 0;
const REQUIRED_CLICKS = 6767;

// Get elements
const egg = document.querySelector('.egg');
const eggCounter = document.querySelector('.egg-counter');
const message = document.querySelector('.message');
const duck = document.querySelector('.duck');
const festiveText = document.querySelector('.festive-text');
const duckContainer = document.querySelector('.duck-container');

// Handle egg clicks
if (egg) {
  egg.addEventListener('click', function(e) {
    clickCount++;
    
    // Update counter display
    const remainingClicks = REQUIRED_CLICKS - clickCount;
    if (remainingClicks > 0) {
      eggCounter.textContent = remainingClicks;
    }
    
    // Add click animation effect
    egg.style.animation = 'none';
    setTimeout(() => {
      egg.style.animation = '';
    }, 50);
    
    // Check if we've reached 42 clicks
    if (clickCount === REQUIRED_CLICKS) {
      revealSecret();
    }
  });
}

function revealSecret() {
  // Hide the egg
  egg.style.display = 'none';
  eggCounter.style.display = 'none';
  
  // Show the secret content with animations
  message.classList.add('revealed');
  duck.classList.add('revealed');
  festiveText.classList.add('revealed');
  
  // Start snowflakes
  startSnowflakes();
}

// Create snowflakes
function createSnowflake() {
  const snowflake = document.createElement('div');
  snowflake.textContent = '❄';
  snowflake.className = 'snowflake revealed';
  snowflake.style.left = Math.random() * window.innerWidth + 'px';
  snowflake.style.opacity = Math.random() * 0.5 + 0.5;
  snowflake.style.animationDuration = Math.random() * 3 + 5 + 's';
  snowflake.style.animationDelay = Math.random() * 2 + 's';
  
  document.body.appendChild(snowflake);
  
  // Remove snowflake after animation completes
  setTimeout(() => {
    snowflake.remove();
  }, 8000 + Math.random() * 2000);
}

function startSnowflakes() {
  // Generate initial batch of snowflakes
  for (let i = 0; i < 15; i++) {
    setTimeout(createSnowflake, i * 100);
  }
  
  // Continue generating snowflakes
  setInterval(createSnowflake, 300);
}

