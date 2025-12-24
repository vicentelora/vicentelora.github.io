class ScratchCard {
  constructor(canvasId, revealedContentId, textId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.revealedContent = document.getElementById(revealedContentId);
    this.text = document.getElementById(textId);
    this.isDrawing = false;
    this.revealed = false;
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Draw the scratch card overlay
    this.drawScratchCard();
    
    // Event listeners
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
    
    // Prevent text selection while scratching
    this.canvas.style.userSelect = 'none';
  }
  
  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    this.canvas.width = wrapper.offsetWidth;
    this.canvas.height = wrapper.offsetHeight;
    this.drawScratchCard();
  }
  
  drawScratchCard() {
    // Draw silver/scratch card texture
    this.ctx.fillStyle = '#CCCCCC';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add texture
    this.ctx.fillStyle = '#BBBBBB';
    for (let i = 0; i < this.canvas.width; i += 2) {
      for (let j = 0; j < this.canvas.height; j += 2) {
        if ((i + j) % 4 === 0) {
          this.ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    
    // Add text
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('SCRATCH HERE', this.canvas.width / 2, this.canvas.height / 2 - 30);
    this.ctx.fillText('👆', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    this.draw(e);
  }
  
  stopDrawing() {
    this.isDrawing = false;
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    let x, y;
    
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    // Clear area (erase)
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Check if enough area has been revealed
    this.checkReveal();
  }
  
  checkReveal() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    let revealedPixels = 0;
    
    // Count transparent pixels (every 4th pixel is alpha)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) {
        revealedPixels++;
      }
    }
    
    const revealPercentage = (revealedPixels / (data.length / 4)) * 100;
    
    // If 45% or more is revealed, show the content
    if (revealPercentage > 45 && !this.revealed) {
      this.reveal();
    }
  }
  
  reveal() {
    this.revealed = true;
    this.canvas.style.display = 'none';
    this.canvas.style.pointerEvents = 'none';
    this.revealedContent.classList.add('celebrate');
    
    // Show the text
    if (this.text) {
      this.text.classList.add('visible');
    }
    
    // Create confetti
    this.createConfetti();
  }
  
  createConfetti() {
    const confettiPieces = ['🎉', '🎊', '🎁', '✨', '🌟', '💝'];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = confettiPieces[Math.floor(Math.random() * confettiPieces.length)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.delay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 5000);
    }
  }
}

// Initialize the scratch card when page loads
document.addEventListener('DOMContentLoaded', () => {
  new ScratchCard('scratchCanvas', 'revealedContent', 'revealText');
});
