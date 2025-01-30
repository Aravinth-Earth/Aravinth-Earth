document.addEventListener('DOMContentLoaded', () => {
  const loadPlanInput = document.getElementById('load-plan');
  const addEventBtn = document.getElementById('add-event');
  const eventsContainer = document.getElementById('events-container');
  const timelineDiv = document.getElementById('timeline');
  const intervalSelect = document.getElementById('time-interval');

  intervalSelect.addEventListener('change', updateTimeline);

  // Add keyboard accessibility for buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        button.click();
      }
    });
  });

  // Add Event
  addEventBtn.addEventListener('click', () => {
    const eventDiv = createEventElement();
    eventsContainer.appendChild(eventDiv);
    updateTimeline();
  });

  // Create Event Element
  function createEventElement(name = '', duration = '') {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';
    eventDiv.innerHTML = `
      <input type="text" name="eventName" placeholder="Event Name" value="${name}" required>
      <input type="number" name="eventDuration" placeholder="Duration (minutes)" value="${duration}" min="1" required>
      <button type="button" class="move-up" aria-label="Move Up">⬆️</button>
      <button type="button" class="move-down" aria-label="Move Down">⬇️</button>
      <button type="button" class="remove-event" aria-label="Remove Event">✖️</button>
    `;
    return eventDiv;
  }

  // Remove Event
  eventsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('move-up')) {
      const eventDiv = e.target.parentElement;
      if (eventDiv.previousElementSibling) {
        eventsContainer.insertBefore(eventDiv, eventDiv.previousElementSibling);
        updateTimeline();
      }
    } else if (e.target.classList.contains('move-down')) {
      const eventDiv = e.target.parentElement;
      if (eventDiv.nextElementSibling) {
        eventsContainer.insertBefore(eventDiv.nextElementSibling, eventDiv);
        updateTimeline();
      }
    } else if (e.target.classList.contains('remove-event')) {
      e.target.parentElement.remove();
      updateTimeline();
    }
  });

  // Update Timeline
  function updateTimeline() {
    const targetEndTime = new Date(document.getElementById('target-end-time').value);
    const events = Array.from(eventsContainer.getElementsByClassName('event')).map(eventDiv => {
      const name = eventDiv.querySelector('input[name="eventName"]').value;
      const duration = parseInt(eventDiv.querySelector('input[name="eventDuration"]').value);
      return { name, duration };
    });

    const reversedEvents = events.slice();

    const calculatedEvents = calculateReverseTimeline(targetEndTime, reversedEvents);
    displayTimeline(calculatedEvents);
  }

  // Calculate Reverse Timeline
  function calculateReverseTimeline(targetEndTime, events) {
    let currentTime = new Date(targetEndTime);
    const result = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const endTime = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() - event.duration);
      const startTime = new Date(currentTime);
      result.push({
        name: event.name,
        duration: event.duration,
        startTime,
        endTime
      });
    }

    return result;
  }

  // Display Timeline
  function displayTimeline(events) {
    if (events.length === 0) {
      timelineDiv.innerHTML = `
        <p class="no-events-message">No events to display. Please add events to see the timeline.</p>
      `;
      return;
    }

    const interval = intervalSelect.value;
    const intervalMinutes = getIntervalMinutes(interval);

    // Set CSS variable for interval minutes
    document.documentElement.style.setProperty('--interval-minutes', intervalMinutes);

    // Update timeline content to only contain the events column
    timelineDiv.innerHTML = `
      <div class="timeline-content">
        <div class="timeline-events-column" id="timeline-events-column"></div>
      </div>
    `;

    const eventsColumn = document.getElementById('timeline-events-column');

    // Create event blocks with proper scaling
    events.reverse().forEach(event => {
      const eventBlock = document.createElement('div');
      eventBlock.className = 'timeline-event-block';
      
      const interval = intervalSelect.value;
      const intervalMinutes = getIntervalMinutes(interval);
      const minimumHeight = 40; // 2.5rem equivalent
      
      // Calculate heights and check for compression
      const timeScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-block-height'));
      const calculatedHeight = (event.duration / intervalMinutes) * timeScale;
      
      if (calculatedHeight < minimumHeight) {
        eventBlock.classList.add('compressed');
      } else {
        // Add duration-based class for non-compressed events
        eventBlock.classList.add(getDurationClass(event.duration));
      }
      
      eventBlock.style.height = `${Math.max(calculatedHeight, minimumHeight)}px`;
      
      const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const duration = `${Math.floor(event.duration / 60).toString().padStart(2, '0')}:${(event.duration % 60).toString().padStart(2, '0')}`;

      eventBlock.innerHTML = `
        <span>[ ${startTime} > ${duration} > ${endTime} ] => ${event.name}</span>
      `;
      eventsColumn.appendChild(eventBlock);
    });

    // Add a line at the bottom to represent the target end time
    const targetEndTime = new Date(document.getElementById('target-end-time').value);
    const targetEndTimeString = targetEndTime.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: 'short', day: 'numeric' });
    const eventName = document.getElementById('event-name').value;

    const targetEndBlock = document.createElement('div');
    targetEndBlock.className = 'timeline-target-end-block';
    targetEndBlock.innerHTML = `
      <span>${eventName ? `${eventName} - ` : ''}Target End Time: ${targetEndTimeString}</span>
    `;
    eventsColumn.appendChild(targetEndBlock);
  }

  function getIntervalMinutes(interval) {
    return parseInt(interval);
  }

  function getDurationClass(duration) {
    if (duration <= 15) return 'duration-xs';
    if (duration <= 30) return 'duration-s';
    if (duration <= 60) return 'duration-m';
    if (duration <= 120) return 'duration-l';
    return 'duration-xl';
  }

  // Save Plan
  function savePlan() {
    const eventName = document.getElementById('event-name').value;
    const targetEndTime = document.getElementById('target-end-time').value;
    const events = Array.from(eventsContainer.getElementsByClassName('event')).map(eventDiv => ({
      name: eventDiv.querySelector('input[name="eventName"]').value,
      duration: parseInt(eventDiv.querySelector('input[name="eventDuration"]').value)
    }));

    const plan = {
      eventName,
      targetEndTime,
      events
    };

    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date(targetEndTime).toISOString().replace(/[:]/g, '-').slice(0, 16);
    const filename = eventName ? `${eventName}_${timestamp}.json` : `timeline-plan_${timestamp}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Cache Management
  function saveToCache() {
    const eventName = document.getElementById('event-name').value;
    const targetEndTime = document.getElementById('target-end-time').value;
    const events = Array.from(eventsContainer.getElementsByClassName('event')).map(eventDiv => ({
      name: eventDiv.querySelector('input[name="eventName"]').value,
      duration: parseInt(eventDiv.querySelector('input[name="eventDuration"]').value)
    }));

    const plan = {
      eventName,
      targetEndTime,
      events
    };
    localStorage.setItem('timelinePlan', JSON.stringify(plan));
  }

  function loadFromCache() {
    const cached = localStorage.getItem('timelinePlan');
    if (cached) {
      const plan = JSON.parse(cached);
      document.getElementById('event-name').value = plan.eventName || '';
      document.getElementById('target-end-time').value = plan.targetEndTime;
      eventsContainer.innerHTML = '';
      plan.events.forEach(event => {
        const eventDiv = createEventElement(event.name, event.duration);
        eventsContainer.appendChild(eventDiv);
      });
      updateTimeline();
      return true;
    }
    return false;
  }

  // Export Plan
  function exportPlan() {
    savePlan();
  }

  // Attach exportPlan to the window object
  window.exportPlan = exportPlan;

  // Load Plan
  loadPlanInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const plan = JSON.parse(event.target.result);
        if (plan.eventName) {
          document.getElementById('event-name').value = plan.eventName;
        }
        document.getElementById('target-end-time').value = plan.targetEndTime;
        eventsContainer.innerHTML = '';
        plan.events.forEach(event => {
          const eventDiv = createEventElement(event.name, event.duration);
          eventsContainer.appendChild(eventDiv);
        });
        updateTimeline();
      } catch (error) {
        alert('Invalid file format.');
      }
    };
    reader.readAsText(file);
  });

  // Clear Data
  function clearData() {
    document.getElementById('event-name').value = '';
    document.getElementById('target-end-time').value = '';
    eventsContainer.innerHTML = '';
    localStorage.removeItem('timelinePlan');
    updateTimeline();
  }

  // Attach clearData to the window object
  window.clearData = clearData;

  // Generate Random Data
  function generateRandomData() {
    prefillForm();
  }

  // Attach generateRandomData to the window object
  window.generateRandomData = generateRandomData;

  // Pre-fill form with future date and random events
  function prefillForm() {
    const targetEndTime = new Date();
    targetEndTime.setDate(targetEndTime.getDate() + 1); // Set target end time to 1 day in the future
    document.getElementById('target-end-time').value = targetEndTime.toISOString().slice(0, 16);

    const eventNames = ['Meeting', 'Workout', 'Lunch', 'Project Work', 'Reading', 'Shopping', 'Cooking', 'Cleaning', 'Study', 'Relax'];
    eventsContainer.innerHTML = '';

    const events = [];
    for (let i = 0; i < 10; i++) {
      const randomDuration = Math.floor(Math.random() * (150 - 15 + 1)) + 15;
      const eventName = eventNames[i % eventNames.length];
      const eventDiv = createEventElement(eventName, randomDuration);
      eventsContainer.appendChild(eventDiv);
      events.push({ name: eventName, duration: randomDuration });
    }

    const calculatedEvents = calculateReverseTimeline(targetEndTime, events);
    displayTimeline(calculatedEvents);
  }

  // Replace the prefillForm call with cache check
  if (!loadFromCache()) {
    prefillForm();
  }

  // Update timeline when target end time changes
  document.getElementById('target-end-time').addEventListener('change', () => {
    updateTimeline();
    saveToCache(); // Changed from savePlan to saveToCache
  });

  // Update timeline when event details change
  eventsContainer.addEventListener('input', () => {
    updateTimeline();
    saveToCache(); // Changed from savePlan to saveToCache
  });
});

// the background dotted line logic is not yet proper