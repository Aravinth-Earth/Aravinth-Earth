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

    const calculatedEvents = calculateReverseTimeline(targetEndTime, events);
    displayTimeline(calculatedEvents);
  }

  // Calculate Reverse Timeline
  function calculateReverseTimeline(targetEndTime, events) {
    let currentTime = new Date(targetEndTime);
    const result = [];

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      const endTime = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() - event.duration);
      const startTime = new Date(currentTime);
      result.unshift({
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
        <div class="timeline-header">
          <div class="timeline-time">Time</div>
          <div class="timeline-events">Events</div>
        </div>
        <div class="timeline-content">
          <div class="timeline-time-column" id="timeline-time-column"></div>
          <div class="timeline-events-column" id="timeline-events-column"></div>
        </div>
        <p class="no-events-message">No events to display. Please add events to see the timeline.</p>
      `;
      return;
    }

    const interval = intervalSelect.value;
    const intervalMinutes = getIntervalMinutes(interval);

    // Set CSS variable for interval minutes
    document.documentElement.style.setProperty('--interval-minutes', intervalMinutes);

    timelineDiv.innerHTML = `
      <div class="timeline-header">
        <div class="timeline-time">Time</div>
        <div class="timeline-events">Events</div>
      </div>
      <div class="timeline-content">
        <div class="timeline-time-column" id="timeline-time-column"></div>
        <div class="timeline-events-column" id="timeline-events-column"></div>
      </div>
    `;

    const timeColumn = document.getElementById('timeline-time-column');
    const eventsColumn = document.getElementById('timeline-events-column');

    // Create time blocks
    let currentTime = new Date(events[0].startTime);
    while (currentTime <= events[events.length - 1].endTime) {
      const timeBlock = document.createElement('div');
      timeBlock.className = 'timeline-time-block';
      timeBlock.innerHTML = `<span>${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>`;
      timeColumn.appendChild(timeBlock);
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }

    // Reverse the events array before displaying
    events = events.slice().reverse();

    // Create event blocks with proper scaling
    events.forEach(event => {
      const eventBlock = document.createElement('div');
      eventBlock.className = 'timeline-event-block';
      
      // Calculate how many time blocks this event should span
      const blocksCount = Math.ceil(event.duration / intervalMinutes);
      eventBlock.style.height = `calc(var(--time-block-height) * ${blocksCount})`;
      
      const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const duration = `${Math.floor(event.duration / 60).toString().padStart(2, '0')}:${(event.duration % 60).toString().padStart(2, '0')}`;

      eventBlock.innerHTML = `
        <span>[ ${startTime} > ${duration} > ${endTime} ] => ${event.name} </span>
      `;
      eventsColumn.appendChild(eventBlock);
    });
  }

  function getIntervalMinutes(interval) {
    return parseInt(interval);
  }

  // Save Plan
  function savePlan() {
    const eventName = document.getElementById('event-name').value;
    const targetEndTime = document.getElementById('target-end-time').value;
    const events = Array.from(eventsContainer.getElementsByClassName('event')).map(eventDiv => {
      const name = eventDiv.querySelector('input[name="eventName"]').value;
      const duration = eventDiv.querySelector('input[name="eventDuration"]').value;
      return { name, duration };
    });

    const plan = { eventName, targetEndTime, events };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = eventName ? `${eventName}-${new Date().toISOString()}.json` : `timeline-plan-${new Date().toISOString()}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);    
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
    document.getElementById('target-end-time').value = '';
    eventsContainer.innerHTML = '';
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

  // Call prefillForm on page load
  prefillForm();

  // Update timeline when target end time changes
  document.getElementById('target-end-time').addEventListener('change', updateTimeline);

  // Update timeline when event details change
  eventsContainer.addEventListener('input', updateTimeline);
});