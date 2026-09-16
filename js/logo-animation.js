// SVG Animation Control
const logoSvg = document.getElementById('mlsys-logo');

// Generate logo SVG content
(function () {
    const grid = [
        [null, 'M', 'L', 'S', 'Y', 'S'],
        ['E', 'N', 'G', 'I', 'N', 'E'],
        ['E', 'R', 'I', 'N', 'G', null]
    ];

    const startX = 42;
    const startY = 42;
    const spacing = 66;
    const circleRadius = 20;
    const ringRadius = 35;
    const textYOffset = 3.5;
    const fontSize = 30;
    const dotRadius = 6;

    const container = document.getElementById('logo-content');
    let positionIndex = 0;

    grid.forEach((row, rowIdx) => {
        row.forEach((letter, colIdx) => {
            const cx = startX + colIdx * spacing;
            const cy = startY + rowIdx * spacing;

            // Main circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', circleRadius);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', 'var(--text-main, black)');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('data-position-index', positionIndex);
            container.appendChild(circle);

            // Text or dot
            if (letter === null) {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r', dotRadius);
                dot.setAttribute('fill', 'var(--text-main, black)');
                dot.setAttribute('stroke', 'none');
                dot.setAttribute('stroke-width', '2');
                dot.setAttribute('data-position-index', positionIndex);
                container.appendChild(dot);
            } else {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx);
                text.setAttribute('y', cy + textYOffset);
                text.setAttribute('font-size', fontSize);
                text.setAttribute('fill', 'var(--text-main, black)');
                text.setAttribute('font-family', 'var(--font-main)');
                text.setAttribute('font-weight', '700');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('data-position-index', positionIndex);
                text.textContent = letter;
                container.appendChild(text);
            }

            // Clickable ring
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('cx', cx);
            ring.setAttribute('cy', cy);
            ring.setAttribute('r', ringRadius);
            ring.setAttribute('fill', 'transparent');
            ring.setAttribute('stroke', 'none');
            ring.setAttribute('class', 'clickable-ring');
            ring.setAttribute('data-position-index', positionIndex);
            if (rowIdx === 0 && colIdx === 0) {
                ring.setAttribute('data-ring-index', 0);
            }
            container.appendChild(ring);

            positionIndex++;
        });
    });
})();

const ANIMATION_DURATION = 100; // Time in ms for grow/shrink animations
const CASCADE_TIMEOUT = 100; // Total timeout for all cascade effects
const MIN_CASCADE_INTERVAL = 900; // Minimum time in ms between cascades
// Helper function to animate SVG viewBox
function animateViewBox(fromViewBox, toViewBox, duration = 1000) {
    const fromValues = fromViewBox.split(' ').map(Number);
    const toValues = toViewBox.split(' ').map(Number);
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = fromValues.map((from, i) =>
            from + (toValues[i] - from) * progress
        );

        logoSvg.setAttribute('viewBox', current.join(' '));

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Helper function to animate SVG width/height
function animateSize(targetWidth, targetHeight, duration = 1000) {
    const startWidth = logoSvg.offsetWidth || 550;
    const startHeight = logoSvg.offsetHeight || 215;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const width = startWidth + (targetWidth - startWidth) * progress;
        const height = startHeight + (targetHeight - startHeight) * progress;

        logoSvg.style.width = width + 'px';
        logoSvg.style.height = height + 'px';

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Helper function to animate transform/scale
function animateScale(targetScale, duration = 1000) {
    const startScale = logoSvg.style.transform
        ? parseFloat(logoSvg.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1)
        : 1;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const scale = startScale + (targetScale - startScale) * progress;
        logoSvg.style.transform = `scale(${scale})`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Helper function to animate circle radius
function animateCircleRadius(circle, targetRadius, duration = 500) {
    const startRadius = parseFloat(circle.getAttribute('r'));
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const radius = startRadius + (targetRadius - startRadius) * progress;
        circle.setAttribute('r', radius);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Setup click handlers for clickable rings
function initializeCircleInteractions() {
    // Constants for auto-click timing
    const AUTO_CLICK_DELAY = 3000; // 3 seconds of inactivity before auto-click

    // Build adjacency map for all rings
    const ringAdjacency = new Map();
    const ringAnimationRound = new Map(); // Track which round each ring was animated in
    const roundShouldShow = new Map(); // Track whether each round should show (true) or hide (false)
    const ringOriginalRadius = new Map(); // Track original radius for each ring to prevent compound growth
    let currentRoundId = 0;
    let autoClickTimer = null;
    let isAnimating = false; // Shared animation state

    // Queue system for processing clicks
    const clickQueue = [];
    let isConsumerRunning = false;
    const activeTimeouts = new Set(); // Track all active timeouts for cleanup

    const allRings = Array.from(logoSvg.querySelectorAll('circle')).filter(c => {
        const r = c.getAttribute('r');
        return r === '20';
    });

    allRings.forEach(ring => {
        const cx = parseFloat(ring.getAttribute('cx'));
        const cy = parseFloat(ring.getAttribute('cy'));
        const neighbors = [];

        // Store original radius for this ring
        const originalRadius = parseFloat(ring.getAttribute('r'));
        ringOriginalRadius.set(ring, originalRadius);

        allRings.forEach(otherRing => {
            if (ring === otherRing) return;

            const oCx = parseFloat(otherRing.getAttribute('cx'));
            const oCy = parseFloat(otherRing.getAttribute('cy'));

            // Check for direct horizontal or vertical neighbors
            const distX = Math.abs(oCx - cx);
            const distY = Math.abs(oCy - cy);

            const isHorizontalNeighbor = distY < 5 && distX > 50 && distX < 80;
            const isVerticalNeighbor = distX < 5 && distY > 50 && distY < 80;

            if (isHorizontalNeighbor || isVerticalNeighbor) {
                neighbors.push(otherRing);
            }
        });

        ringAdjacency.set(ring, neighbors);
        ringAnimationRound.set(ring, -1); // Initialize with -1 (no round)
    });

    const clickableRings = logoSvg.querySelectorAll('.clickable-ring');
    const cornerClickableRings = Array.from(clickableRings).filter(ring => {
        const cx = parseFloat(ring.getAttribute('cx'));
        const cy = parseFloat(ring.getAttribute('cy'));
        const allCx = Array.from(clickableRings).map(r => parseFloat(r.getAttribute('cx')));
        const allCy = Array.from(clickableRings).map(r => parseFloat(r.getAttribute('cy')));
        const minCx = Math.min(...allCx);
        const maxCx = Math.max(...allCx);
        const minCy = Math.min(...allCy);
        const maxCy = Math.max(...allCy);
        return (cx === minCx || cx === maxCx) && (cy === minCy || cy === maxCy);
    });

    // Consumer function that processes click queue
    function processClickQueue() {
        if (clickQueue.length === 0) {
            isConsumerRunning = false;
            return;
        }

        if (isAnimating) {
            // If still animating, check again soon
            const timeoutId = setTimeout(processClickQueue, 100);
            activeTimeouts.add(timeoutId);
            return;
        }

        const ring = clickQueue.shift();
        executeClick(ring);

        // Schedule next processing after MIN_CASCADE_INTERVAL
        const timeoutId = setTimeout(processClickQueue, MIN_CASCADE_INTERVAL);
        activeTimeouts.add(timeoutId);
    }

    // Start consumer if not already running
    function startConsumer() {
        if (!isConsumerRunning && clickQueue.length > 0) {
            isConsumerRunning = true;
            processClickQueue();
        }
    }

    // Execute a click on a ring
    function executeClick(ring) {
        if (isAnimating) return;

        // Reset auto-click timer on click execution
        resetAutoClickTimer();

        isAnimating = true;
        currentRoundId++;

        // Determine if this round should show or hide based on the clicked ring's current state
        const positionIndex = ring.getAttribute('data-position-index');
        const textElement = logoSvg.querySelector(`text[data-position-index="${positionIndex}"]`);
        const innerCircle = logoSvg.querySelector(`circle[data-position-index="${positionIndex}"][r="6"]`);

        // Check current visibility state - if currently visible, this round will hide; if hidden, this round will show
        const element = textElement || innerCircle;
        const currentlyVisible = !element || element.getAttribute('data-visible') !== 'false';
        roundShouldShow.set(currentRoundId, !currentlyVisible);

        // Start cascade animation from clicked ring
        cascadeAnimation(ring, currentRoundId, 0);

        const timeoutId = setTimeout(() => {
            isAnimating = false;
            activeTimeouts.delete(timeoutId);
        }, CASCADE_TIMEOUT);
        activeTimeouts.add(timeoutId);
    }

    // Auto-click functionality: randomly pick a ring after 3 seconds of inactivity
    function resetAutoClickTimer() {
        // Clear existing timer
        if (autoClickTimer) {
            clearTimeout(autoClickTimer);
        }

        // Set new timer for 3 seconds
        autoClickTimer = setTimeout(() => {
            if (!isAnimating && clickQueue.length === 0) {
                // Check if rings are currently hidden by checking the first ring's visibility
                const firstRing = allRings[0];
                const isHidden = firstRing.getAttribute('data-visible') === 'false';

                // If rings are hidden, only dispatch one animation; otherwise dispatch two
                const numAnimations = isHidden ? 1 : 2;

                // Pick random clickable rings and add them to queue
                const randomIndex = Math.floor(Math.random() * cornerClickableRings.length);

                // Find the associated ring
                const ring1 = allRings.find(r =>
                    parseFloat(r.getAttribute('cx')) === parseFloat(cornerClickableRings[randomIndex].getAttribute('cx')) &&
                    parseFloat(r.getAttribute('cy')) === parseFloat(cornerClickableRings[randomIndex].getAttribute('cy'))
                );

                if (ring1) clickQueue.push(ring1);

                // Only add second ring if we need two animations
                if (numAnimations === 2) {
                    const ring2 = allRings.find(r =>
                        parseFloat(r.getAttribute('cx')) === parseFloat(cornerClickableRings[randomIndex].getAttribute('cx')) &&
                        parseFloat(r.getAttribute('cy')) === parseFloat(cornerClickableRings[randomIndex].getAttribute('cy'))
                    );
                    if (ring2) clickQueue.push(ring2);
                }

                startConsumer();
            } else if (isAnimating || clickQueue.length > 0) {
                // If still animating or queue has items, try again after a short delay
                resetAutoClickTimer();
            }
        }, AUTO_CLICK_DELAY);
    }

    clickableRings.forEach(clickableArea => {
        // Find the associated ring by matching cx and cy coordinates
        const cx = parseFloat(clickableArea.getAttribute('cx'));
        const cy = parseFloat(clickableArea.getAttribute('cy'));

        const ring = allRings.find(r =>
            parseFloat(r.getAttribute('cx')) === cx &&
            parseFloat(r.getAttribute('cy')) === cy
        );

        if (!ring) return;

        clickableArea.style.cursor = 'pointer';
        clickableArea.addEventListener('click', function (e) {
            e.stopPropagation();

            // Add click to queue and start consumer
            clickQueue.push(ring);
            startConsumer();
        });
    });

    // Helper function for cascade animation
    function cascadeAnimation(ring, roundId, delay) {
        // Skip if already animated in this round
        if (ringAnimationRound.get(ring) === roundId) {
            return;
        }

        // Always use the stored original radius to prevent compound growth from rapid clicks
        const originalRadius = ringOriginalRadius.get(ring);

        setTimeout(() => {
            // Mark as animated in this round
            ringAnimationRound.set(ring, roundId);

            // Use the round's decision for show/hide
            const shouldShow = roundShouldShow.get(roundId);

            // Reset to original radius first, then grow
            ring.setAttribute('r', originalRadius);
            animateCircleRadius(ring, originalRadius * 1.5, ANIMATION_DURATION);

            // Start neighbors growing while this ring is shrinking (overlap)
            const neighbors = ringAdjacency.get(ring) || [];
            neighbors.forEach(neighbor => {
                cascadeAnimation(neighbor, roundId, ANIMATION_DURATION);
            });

            // Shrink after grow completes
            setTimeout(() => {
                // Toggle outer ring at the start of shrink (end of enlarge)
                ring.style.transition = 'opacity 0.1s';
                ring.style.opacity = shouldShow ? '1' : '0';
                ring.setAttribute('data-visible', shouldShow ? 'true' : 'false');

                // Find the text or inner circle at this position
                const positionIndex = ring.getAttribute('data-position-index');
                const textElement = logoSvg.querySelector(`text[data-position-index="${positionIndex}"]`);
                const innerCircle = logoSvg.querySelector(`circle[data-position-index="${positionIndex}"][r="6"]`);

                if (textElement) {
                    textElement.style.transition = 'opacity 0.1s';
                    textElement.style.opacity = shouldShow ? '1' : '0';
                    textElement.setAttribute('data-visible', shouldShow ? 'true' : 'false');
                }
                if (innerCircle) {
                    innerCircle.style.transition = 'opacity 0.1s';
                    innerCircle.style.opacity = shouldShow ? '1' : '0';
                    innerCircle.setAttribute('data-visible', shouldShow ? 'true' : 'false');
                }

                animateCircleRadius(ring, originalRadius, ANIMATION_DURATION);
            }, ANIMATION_DURATION);
        }, delay);
    }

    // Clean up function to reset everything
    function cleanupAnimation() {
        // Clear all active timeouts
        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts.clear();

        // Clear auto-click timer
        if (autoClickTimer) {
            clearTimeout(autoClickTimer);
            autoClickTimer = null;
        }

        // Clear queue
        clickQueue.length = 0;

        // Reset animation state
        isAnimating = false;
        isConsumerRunning = false;

        // Reset round tracking to prevent stale states
        ringAnimationRound.forEach((value, ring) => {
            ringAnimationRound.set(ring, -1);
        });
        roundShouldShow.clear();
    }

    // Handle visibility changes to prevent issues when tab is hidden
    function handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - clean up all timers and state
            cleanupAnimation();
        } else {
            // Page is visible again - restart auto-click timer
            resetAutoClickTimer();
        }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start the auto-click timer
    resetAutoClickTimer();
}

// Expose API for external use
window.logoAnimations = {
    animateViewBox,
    animateSize,
    animateScale,
    animateCircleRadius,
    setSvgElement: (element) => { logoSvg = element; }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCircleInteractions);
} else {
    initializeCircleInteractions();
}
