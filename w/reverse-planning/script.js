// Timeline State Management
class TimelineState {
  constructor() {
    this.events = [];
    this.targetEndTime = null;
    this.eventName = '';
  }
}

// Timeline UI Handler
class TimelineUI {
  constructor() {
    this.state = new TimelineState();
    this.initializeElements();
    this.attachEventListeners();
    this.loadInitialState();
  }

  initializeElements() {
    this.loadPlanInput = document.getElementById('load-plan');
    this.addEventBtn = document.getElementById('add-event');
    this.eventsContainer = document.getElementById('events-container');
    this.timelineDiv = document.getElementById('timeline');
    this.intervalSelect = document.getElementById('time-interval');
  }

  attachEventListeners() {
    this.intervalSelect.addEventListener('change', this.updateTimeline.bind(this));

    // Add keyboard accessibility for buttons
    document.querySelectorAll('button').forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          button.click();
        }
      });
    });

    // Add Event
    this.addEventBtn.addEventListener('click', () => {
      const eventDiv = EventManager.createEventElement();
      this.eventsContainer.appendChild(eventDiv);
      this.updateTimeline();
    });

    // Remove Event
    this.eventsContainer.addEventListener('click', (e) => {
      EventManager.handleEventControls(e, this.eventsContainer);
      this.updateTimeline();
    });

    // Load Plan
    this.loadPlanInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const plan = JSON.parse(event.target.result);
          this.loadPlanData(plan);
          this.updateTimeline();
        } catch (error) {
          console.error('Error loading plan:', error);
          alert('Invalid file format.');
        }
      };
      reader.readAsText(file);
    });

    // Update timeline when target end time changes
    document.getElementById('target-end-time').addEventListener('change', () => {
      this.updateTimeline();
      StorageManager.saveToCache(this.state); // Changed from savePlan to saveToCache
    });

    // Update timeline when event details change
    this.eventsContainer.addEventListener('input', () => {
      this.updateTimeline();
      StorageManager.saveToCache(this.state); // Changed from savePlan to saveToCache
    });
  }

  updateTimeline() {
    const targetEndTime = new Date(document.getElementById('target-end-time').value);
    const events = Array.from(this.eventsContainer.getElementsByClassName('event')).map(eventDiv => {
      const name = eventDiv.querySelector('input[name="eventName"]').value;
      const duration = parseInt(eventDiv.querySelector('input[name="eventDuration"]').value);
      return { name, duration };
    });

    const reversedEvents = events.slice();

    const calculatedEvents = TimelineCalculator.calculateReverseTimeline(targetEndTime, reversedEvents);
    this.displayTimeline(calculatedEvents);
  }

  displayTimeline(events) {
    if (events.length === 0) {
      this.timelineDiv.innerHTML = `
        <p class="no-events-message">No events to display. Please add events to see the timeline.</p>
      `;
      return;
    }

    const interval = this.intervalSelect.value;
    const intervalMinutes = this.getIntervalMinutes(interval);

    // Set CSS variable for interval minutes
    document.documentElement.style.setProperty('--interval-minutes', intervalMinutes);

    // Update timeline content to only contain the events column
    this.timelineDiv.innerHTML = `
      <div class="timeline-content">
        <div class="timeline-events-column" id="timeline-events-column"></div>
      </div>
    `;

    const eventsColumn = document.getElementById('timeline-events-column');

    // Create event blocks with proper scaling
    events.reverse().forEach(event => {
      const eventBlock = document.createElement('div');
      eventBlock.className = 'timeline-event-block';
      
      const interval = this.intervalSelect.value;
      const intervalMinutes = this.getIntervalMinutes(interval);
      const minimumHeight = 40; // 2.5rem equivalent
      
      // Calculate heights and check for compression
      const timeScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-block-height'));
      const calculatedHeight = (event.duration / intervalMinutes) * timeScale;
      
      if (calculatedHeight < minimumHeight) {
        eventBlock.classList.add('compressed');
      } else {
        // Add duration-based class for non-compressed events
        eventBlock.classList.add(TimelineCalculator.getDurationClass(event.duration));
      }
      
      eventBlock.style.height = `${Math.max(calculatedHeight, minimumHeight)}px`;
      
      const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const duration = `${Math.floor(event.duration / 60).toString().padStart(2, '0')}:${(event.duration % 60).toString().padStart(2, '0')}`;

      const span = eventBlock.appendChild(document.createElement('span'));
      span.textContent = `[ ${startTime} > ${duration} > ${endTime} ] => ${event.name}`;
      eventsColumn.appendChild(eventBlock);
    });

    // Add a line at the bottom to represent the target end time
    const targetEndTime = new Date(document.getElementById('target-end-time').value);
    const targetEndTimeString = targetEndTime.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: 'short', day: 'numeric' });
    const eventName = document.getElementById('event-name').value;

    const targetEndBlock = document.createElement('div');
    targetEndBlock.className = 'timeline-target-end-block';
    const endSpan = targetEndBlock.appendChild(document.createElement('span'));
    endSpan.textContent = `${eventName ? `${eventName} - ` : ''}Target End Time: ${targetEndTimeString}`;
    eventsColumn.appendChild(targetEndBlock);
  }

  getIntervalMinutes(interval) {
    return parseInt(interval);
  }

  loadPlanData(plan) {
    document.getElementById('event-name').value = plan.eventName || '';
    document.getElementById('target-end-time').value = plan.targetEndTime || '';
    this.eventsContainer.innerHTML = '';
    if (plan.events && Array.isArray(plan.events)) {
      plan.events.forEach(event => {
        const eventDiv = EventManager.createEventElement(event.name || '', event.duration || '');
        this.eventsContainer.appendChild(eventDiv);
      });
    }
  }

  loadInitialState() {
    if (!StorageManager.loadFromCache()) {
      this.prefillForm();
    }
  }

  prefillForm() {
    const targetEndTime = new Date();
    targetEndTime.setDate(targetEndTime.getDate() + 1); // Set target end time to 1 day in the future
    document.getElementById('target-end-time').value = targetEndTime.toISOString().slice(0, 16);

    const eventNames = ['Meeting', 'Workout', 'Lunch', 'Project Work', 'Reading', 'Shopping', 'Cooking', 'Cleaning', 'Study', 'Relax'];
    this.eventsContainer.innerHTML = '';

    const events = [];
    for (let i = 0; i < 10; i++) {
      const randomDuration = Math.floor(Math.random() * (150 - 15 + 1)) + 15;
      const eventName = eventNames[i % eventNames.length];
      const eventDiv = EventManager.createEventElement(eventName, randomDuration);
      this.eventsContainer.appendChild(eventDiv);
      events.push({ name: eventName, duration: randomDuration });
    }

    const calculatedEvents = TimelineCalculator.calculateReverseTimeline(targetEndTime, events);
    this.displayTimeline(calculatedEvents);
  }

  clearData() {
    // Clear form inputs
    document.getElementById('event-name').value = '';
    document.getElementById('target-end-time').value = '';
    this.eventsContainer.innerHTML = '';
    
    // Clear local storage
    localStorage.removeItem('timelinePlan');
    
    // Update timeline to show empty state
    this.updateTimeline();
  }
}

// Event Management
class EventManager {
  static createEventElement(name = '', duration = '') {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';

    const nameInput = eventDiv.appendChild(document.createElement('input'));
    nameInput.type = 'text';
    nameInput.name = 'eventName';
    nameInput.placeholder = 'Event Name';
    nameInput.value = name;
    nameInput.required = true;

    const durInput = eventDiv.appendChild(document.createElement('input'));
    durInput.type = 'number';
    durInput.name = 'eventDuration';
    durInput.placeholder = 'Duration (minutes)';
    durInput.value = duration;
    durInput.min = '1';
    durInput.required = true;

    const upBtn = eventDiv.appendChild(document.createElement('button'));
    upBtn.type = 'button';
    upBtn.className = 'move-up';
    upBtn.setAttribute('aria-label', 'Move Up');
    upBtn.textContent = '⬆️';

    const downBtn = eventDiv.appendChild(document.createElement('button'));
    downBtn.type = 'button';
    downBtn.className = 'move-down';
    downBtn.setAttribute('aria-label', 'Move Down');
    downBtn.textContent = '⬇️';

    const rmBtn = eventDiv.appendChild(document.createElement('button'));
    rmBtn.type = 'button';
    rmBtn.className = 'remove-event';
    rmBtn.setAttribute('aria-label', 'Remove Event');
    rmBtn.textContent = '✖️';

    return eventDiv;
  }

  static handleEventControls(event, container) {
    if (event.target.classList.contains('move-up')) {
      const eventDiv = event.target.parentElement;
      if (eventDiv.previousElementSibling) {
        container.insertBefore(eventDiv, eventDiv.previousElementSibling);
      }
    } else if (event.target.classList.contains('move-down')) {
      const eventDiv = event.target.parentElement;
      if (eventDiv.nextElementSibling) {
        container.insertBefore(eventDiv.nextElementSibling, eventDiv);
      }
    } else if (event.target.classList.contains('remove-event')) {
      event.target.parentElement.remove();
    }
  }
}

// Timeline Calculations
class TimelineCalculator {
  static calculateReverseTimeline(targetEndTime, events) {
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

  static getDurationClass(duration) {
    if (duration <= 15) return 'duration-xs';
    if (duration <= 30) return 'duration-s';
    if (duration <= 60) return 'duration-m';
    if (duration <= 120) return 'duration-l';
    return 'duration-xl';
  }
}

// Storage Management
class StorageManager {
  static saveToCache(state) {
    const eventName = document.getElementById('event-name').value;
    const targetEndTime = document.getElementById('target-end-time').value;
    const events = Array.from(document.getElementById('events-container').getElementsByClassName('event')).map(eventDiv => ({
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

  static loadFromCache() {
    const cached = localStorage.getItem('timelinePlan');
    if (cached) {
      const plan = JSON.parse(cached);
      document.getElementById('event-name').value = plan.eventName || '';
      document.getElementById('target-end-time').value = plan.targetEndTime;
      document.getElementById('events-container').innerHTML = '';
      plan.events.forEach(event => {
        const eventDiv = EventManager.createEventElement(event.name, event.duration);
        document.getElementById('events-container').appendChild(eventDiv);
      });
      return true;
    }
    return false;
  }

  static exportToFile(plan) {
    try {
      const timestamp = new Date(plan.targetEndTime).toISOString().replace(/[:]/g, '-').slice(0, 16);
      const filename = plan.eventName ? `${plan.eventName}_${timestamp}.json` : `timeline-plan_${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan. Please check your inputs and try again.');
    }
  }

  static exportPlan() {
    const targetEndTime = document.getElementById('target-end-time').value;
    if (!targetEndTime) {
      alert('Please set a target end time first');
      return;
    }

    const eventName = document.getElementById('event-name').value;
    const events = Array.from(document.getElementById('events-container').getElementsByClassName('event')).map(eventDiv => ({
      name: eventDiv.querySelector('input[name="eventName"]').value,
      duration: parseInt(eventDiv.querySelector('input[name="eventDuration"]').value)
    }));

    if (events.length === 0) {
      alert('Please add at least one event');
      return;
    }

    const plan = { eventName, targetEndTime, events };
    this.exportToFile(plan);
  }
}

// Make exportPlan globally accessible
let timeline; // Add this at the top level

document.addEventListener('DOMContentLoaded', () => {
  timeline = new TimelineUI(); // Store the instance in the global variable
});

// Update the global methods
window.exportPlan = () => StorageManager.exportPlan();
window.clearData = () => timeline.clearData();
window.generateRandomData = () => timeline.prefillForm();