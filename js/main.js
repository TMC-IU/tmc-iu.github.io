/* ============================================
   TMC Website - Main JavaScript
   Handles: Navigation, Event Filtering,
   Form Validation, Calendar, Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ============================================
  // 1. MOBILE NAVIGATION
  // ============================================
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('navOverlay');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      const isOpen = navMenu.classList.contains('open');
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', !isOpen);
      if (navOverlay) navOverlay.classList.toggle('active');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', function() {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close mobile nav on link click
    var navLinks = navMenu.querySelectorAll('.nav__link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================
  // 2. HEADER SCROLL EFFECT
  // ============================================
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // ============================================
  // 3. PAST VS UPCOMING EVENTS (date-based)
  // ============================================
  function getTodayYYYYMMDD() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return String(y) + m + day;
  }

  function formatEventDateForDisplay(yyyymmdd) {
    var year = parseInt(yyyymmdd.substr(0, 4), 10);
    var month = parseInt(yyyymmdd.substr(4, 2), 10); // 1–12
    if (month >= 1 && month <= 5) {
      return 'Spring ' + year;
    } else if (month >= 8 && month <= 12) {
      return 'Fall ' + year;
    } else {
      return 'Summer ' + year;
    }
  }

  function sortPastEventsByDate(gridEl) {
    var pastCards = Array.prototype.slice.call(gridEl.querySelectorAll('.past-event'));
    var decoratedCards = pastCards.map(function(card, index) {
      var eventDate = card.getAttribute('data-event-date') || '';
      return {
        card: card,
        index: index,
        hasDate: /^\d{8}$/.test(eventDate),
        eventDate: eventDate
      };
    });

    decoratedCards.sort(function(a, b) {
      if (a.hasDate && b.hasDate && a.eventDate !== b.eventDate) {
        return a.eventDate > b.eventDate ? -1 : 1;
      }
      if (a.hasDate !== b.hasDate) {
        return a.hasDate ? -1 : 1;
      }
      return a.index - b.index;
    });

    decoratedCards.forEach(function(item) {
      gridEl.appendChild(item.card);
    });
  }

  // Events page: move past events from upcoming to past events grid
  var eventsList = document.getElementById('eventsList');
  var pastEventsGrid = document.getElementById('pastEventsGrid');
  if (eventsList && pastEventsGrid) {
    var cards = eventsList.querySelectorAll('.event-card');
    var today = getTodayYYYYMMDD();
    var existingPastTitles = new Set(
      Array.prototype.map.call(
        pastEventsGrid.querySelectorAll('.past-event__title'),
        function(el) {
          return el.textContent.trim().toLowerCase();
        }
      )
    );

    cards.forEach(function(card) {
      var btn = card.querySelector('.add-to-cal');
      var dateStr = btn ? btn.getAttribute('data-event-date') : null;
      if (!dateStr || dateStr.length !== 8) return;

      if (dateStr < today) {
        var titleEl = card.querySelector('.event-card__title, .timeline__card-title');
        var title = titleEl ? titleEl.textContent.trim() : 'Past Event';
        var normalizedTitle = title.toLowerCase();
        var formattedDate = formatEventDateForDisplay(dateStr);
        var alreadyInPastGrid = existingPastTitles.has(normalizedTitle);

        // If this event already exists in the curated past-events grid, do not duplicate it.
        if (alreadyInPastGrid) {
          var existingPastCards = pastEventsGrid.querySelectorAll('.past-event');
          Array.prototype.forEach.call(existingPastCards, function(existingCard) {
            var existingTitleEl = existingCard.querySelector('.past-event__title');
            var existingTitle = existingTitleEl ? existingTitleEl.textContent.trim().toLowerCase() : '';
            if (existingTitle === normalizedTitle) {
              existingCard.setAttribute('data-event-date', dateStr);
            }
          });
          card.remove();
          return;
        }

        var escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        var pastEl = document.createElement('div');
        pastEl.className = 'past-event past-event--logo-placeholder animate-on-scroll';
        pastEl.setAttribute('data-event-date', dateStr);
        pastEl.innerHTML = '<img class="past-event__image" src="images/TMC_Logo.png" alt="' + escapedTitle + '">' +
          '<div class="past-event__overlay">' +
          '<h4 class="past-event__title">' + escapedTitle + '</h4>' +
          '<span class="past-event__date">' + formattedDate + '</span>' +
          '</div>';
        pastEventsGrid.appendChild(pastEl);
        existingPastTitles.add(normalizedTitle);
        card.remove();
      }
    });

    sortPastEventsByDate(pastEventsGrid);
  }

  // Home page: always show only the next 2 upcoming events, sorted by date
  var homeUpcoming = document.getElementById('homeUpcomingEvents');
  if (homeUpcoming) {
    var homeCards = Array.prototype.slice.call(homeUpcoming.querySelectorAll('.event-card'));
    var todayHome = getTodayYYYYMMDD();

    // Separate into future events (sorted by date) and past events
    var futureCards = homeCards.filter(function(card) {
      var btn = card.querySelector('.add-to-cal');
      var dateStr = btn ? btn.getAttribute('data-event-date') : null;
      return dateStr && dateStr.length === 8 && dateStr >= todayHome;
    });

    futureCards.sort(function(a, b) {
      var aDate = a.querySelector('.add-to-cal').getAttribute('data-event-date');
      var bDate = b.querySelector('.add-to-cal').getAttribute('data-event-date');
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    });

    // Hide all cards first, then show the 2 nearest upcoming ones
    homeCards.forEach(function(card) { card.style.display = 'none'; });
    futureCards.slice(0, 3).forEach(function(card, i) {
      card.style.display = '';
      // Refresh stagger classes so spacing animations look correct
      card.classList.remove('stagger-1', 'stagger-2', 'stagger-3');
      card.classList.add('stagger-' + (i + 1));
    });
  }

  // ============================================
  // 4. EVENT FILTERING
  // ============================================
  var filterButtons = document.querySelectorAll('#eventFilters .filter-btn');
  var eventCards = document.querySelectorAll('#eventsList .event-card');
  var noEventsMsg = document.getElementById('noEvents');

  if (filterButtons.length > 0 && eventCards.length > 0) {
    filterButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var filter = btn.getAttribute('data-filter');

        // Update active button
        filterButtons.forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Filter events
        var visibleCount = 0;
        eventCards.forEach(function(card) {
          var type = card.getAttribute('data-type');
          if (filter === 'all' || type === filter) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });

        // Show/hide no results
        if (noEventsMsg) {
          noEventsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
      });
    });
  }

  // ============================================
  // 5. CONTACT FORM VALIDATION
  // ============================================
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var isValid = true;

      // Validate Name
      var nameInput = document.getElementById('name');
      var nameError = document.getElementById('nameError');
      if (nameInput && nameError) {
        if (!nameInput.value.trim()) {
          nameInput.classList.add('error');
          nameError.classList.add('visible');
          isValid = false;
        } else {
          nameInput.classList.remove('error');
          nameError.classList.remove('visible');
        }
      }

      // Validate Email
      var emailInput = document.getElementById('email');
      var emailError = document.getElementById('emailError');
      if (emailInput && emailError) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
          emailInput.classList.add('error');
          emailError.classList.add('visible');
          isValid = false;
        } else {
          emailInput.classList.remove('error');
          emailError.classList.remove('visible');
        }
      }

      // Validate Year
      var yearSelect = document.getElementById('year');
      var yearError = document.getElementById('yearError');
      if (yearSelect && yearError) {
        if (!yearSelect.value) {
          yearSelect.classList.add('error');
          yearError.classList.add('visible');
          isValid = false;
        } else {
          yearSelect.classList.remove('error');
          yearError.classList.remove('visible');
        }
      }

      // Validate Major
      var majorInput = document.getElementById('major');
      var majorError = document.getElementById('majorError');
      if (majorInput && majorError) {
        if (!majorInput.value.trim()) {
          majorInput.classList.add('error');
          majorError.classList.add('visible');
          isValid = false;
        } else {
          majorInput.classList.remove('error');
          majorError.classList.remove('visible');
        }
      }

      if (isValid) {
        // Hide form and show success message
        contactForm.style.display = 'none';
        if (formSuccess) {
          formSuccess.classList.add('visible');
        }
        // Note: In production, you would send form data to a server here
      }
    });

    // Clear error styling on input
    var formInputs = contactForm.querySelectorAll('.form__input, .form__select, .form__textarea');
    formInputs.forEach(function(input) {
      input.addEventListener('input', function() {
        input.classList.remove('error');
        var errorEl = input.parentElement.querySelector('.form__error');
        if (errorEl) errorEl.classList.remove('visible');
      });
    });
  }

  // ============================================
  // 6. ADD TO CALENDAR (.ics Generation)
  // ============================================
  var calButtons = document.querySelectorAll('.add-to-cal');
  calButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var title = btn.getAttribute('data-event-title') || 'TMC Event';
      var date = btn.getAttribute('data-event-date') || '';
      var time = btn.getAttribute('data-event-time') || '';
      var location = btn.getAttribute('data-event-location') || 'Kelley School of Business, Indiana University';

      // If no date is set, show a message
      if (!date) {
        // Create a temporary tooltip
        var tooltip = document.createElement('span');
        tooltip.textContent = 'Date TBD - check back soon!';
        tooltip.style.cssText = 'position: absolute; background: #212529; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; white-space: nowrap; z-index: 100; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        btn.style.position = 'relative';
        btn.appendChild(tooltip);
        setTimeout(function() {
          tooltip.remove();
        }, 2500);
        return;
      }

      // Generate .ics file — events are 8–9pm (1 hour)
      var startDate = date.replace(/-/g, '');
      var startTimeStr = (time || '2000').replace(/:/g, '');
      var startMins = parseInt(startTimeStr.substring(0, 2), 10) * 60 + parseInt(startTimeStr.substring(2, 4) || '0', 10);
      var endMins = startMins + 60; // +1 hour
      var endHour = Math.floor(endMins / 60) % 24;
      var endMin = endMins % 60;
      var endTimeStr = String(endHour).padStart(2, '0') + String(endMin).padStart(2, '0');
      var timeSuffix = startTimeStr.length >= 4 ? (startTimeStr.length >= 6 ? startTimeStr : startTimeStr + '00') : '200000';
      var startDt = startDate + 'T' + (timeSuffix.length === 6 ? timeSuffix : timeSuffix + '00');
      var endDt = startDate + 'T' + endTimeStr + '00';

      var icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TMC//Events//EN',
        'BEGIN:VTIMEZONE',
        'TZID:America/New_York',
        'BEGIN:DAYLIGHT',
        'DTSTART:20070311T020000',
        'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0400',
        'TZNAME:EDT',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'DTSTART:20071104T020000',
        'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0500',
        'TZNAME:EST',
        'END:STANDARD',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        'DTSTART;TZID=America/New_York:' + startDt,
        'DTEND;TZID=America/New_York:' + endDt,
        'SUMMARY:' + title,
        'LOCATION:' + location,
        'DESCRIPTION:Technology Management Club',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = title.replace(/[^a-zA-Z0-9]/g, '_') + '.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  });

  // ============================================
  // 7. DOWNLOAD ALL CALENDAR INVITES
  // ============================================
  var downloadAllBtn = document.getElementById('downloadAllCal');
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', function() {
      var cards = document.querySelectorAll('#eventsList .event-card');
      var vevents = [];

      cards.forEach(function(card) {
        if (card.style.display === 'none') return;
        var btn = card.querySelector('.add-to-cal');
        if (!btn) return;

        var title    = btn.getAttribute('data-event-title')    || 'TMC Event';
        var date     = btn.getAttribute('data-event-date')     || '';
        var time     = btn.getAttribute('data-event-time')     || '2000';
        var location = btn.getAttribute('data-event-location') || 'Kelley School of Business, Indiana University';

        if (!date || date.length !== 8) return;

        var startDate    = date.replace(/-/g, '');
        var startTimeStr = (time || '2000').replace(/:/g, '');
        var startMins    = parseInt(startTimeStr.substring(0, 2), 10) * 60 + parseInt(startTimeStr.substring(2, 4) || '0', 10);
        var endMins      = startMins + 60;
        var endHour      = Math.floor(endMins / 60) % 24;
        var endMin       = endMins % 60;
        var endTimeStr   = String(endHour).padStart(2, '0') + String(endMin).padStart(2, '0');
        var timeSuffix   = startTimeStr.length >= 4 ? (startTimeStr.length >= 6 ? startTimeStr : startTimeStr + '00') : '200000';
        var startDt      = startDate + 'T' + (timeSuffix.length === 6 ? timeSuffix : timeSuffix + '00');
        var endDt        = startDate + 'T' + endTimeStr + '00';

        vevents.push([
          'BEGIN:VEVENT',
          'DTSTART;TZID=America/New_York:' + startDt,
          'DTEND;TZID=America/New_York:'   + endDt,
          'SUMMARY:'      + title,
          'LOCATION:'     + location,
          'DESCRIPTION:Technology Management Club',
          'END:VEVENT'
        ].join('\r\n'));
      });

      if (vevents.length === 0) {
        var tooltip = document.createElement('span');
        tooltip.textContent = 'No events to download!';
        tooltip.style.cssText = 'position:absolute;background:#212529;color:white;padding:6px 12px;border-radius:6px;font-size:12px;white-space:nowrap;z-index:100;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        downloadAllBtn.style.position = 'relative';
        downloadAllBtn.appendChild(tooltip);
        setTimeout(function() { tooltip.remove(); }, 2500);
        return;
      }

      var vtimezone = [
        'BEGIN:VTIMEZONE',
        'TZID:America/New_York',
        'BEGIN:DAYLIGHT',
        'DTSTART:20070311T020000',
        'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0400',
        'TZNAME:EDT',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'DTSTART:20071104T020000',
        'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0500',
        'TZNAME:EST',
        'END:STANDARD',
        'END:VTIMEZONE'
      ].join('\r\n');

      var icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TMC//Events//EN',
        vtimezone,
        vevents.join('\r\n'),
        'END:VCALENDAR'
      ].join('\r\n');

      var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      var url  = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href     = url;
      link.download = 'TMC_Events.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // ============================================
  // 8. FAQ ACCORDION
  // ============================================
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function(item) {
    var question = item.querySelector('.faq-item__question');
    if (question) {
      question.addEventListener('click', function() {
        var isOpen = item.classList.contains('open');

        // Close all others
        faqItems.forEach(function(otherItem) {
          otherItem.classList.remove('open');
          var otherQ = otherItem.querySelector('.faq-item__question');
          if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
        });

        // Toggle current
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // ============================================
  // 9. SCROLL ANIMATIONS (Intersection Observer)
  // ============================================

  // Also observe .timeline__item elements (they use .visible for slide-in)
  var animatedElements = document.querySelectorAll('.animate-on-scroll, .timeline__item');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  } else {
    animatedElements.forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // ============================================
  // 9b. TIMELINE LINE PROGRESS (scroll-driven)
  // ============================================
  var timelineContainer = document.getElementById('timelineContainer');
  var timelineProgress = document.getElementById('timelineProgress');

  if (timelineContainer && timelineProgress) {
    function updateTimelineProgress() {
      var containerTop = timelineContainer.getBoundingClientRect().top + window.pageYOffset;
      var containerHeight = timelineContainer.offsetHeight;
      var windowH = window.innerHeight;

      // Line starts filling when the top of the container hits 70% of viewport
      var startScroll = containerTop - windowH * 0.70;
      // Line finishes when the bottom of the container hits 30% of viewport
      var endScroll   = containerTop + containerHeight - windowH * 0.30;

      var progress = (window.pageYOffset - startScroll) / (endScroll - startScroll);
      progress = Math.max(0, Math.min(1, progress));

      timelineProgress.style.height = (progress * containerHeight) + 'px';
    }

    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    updateTimelineProgress();
  }

  // ============================================
  // 9c. JOIN PAGE: Getting Started steps line progress (scroll-driven)
  // ============================================
  var stepsTimelineContainer = document.getElementById('stepsTimelineContainer');
  var stepsTimelineProgress = document.getElementById('stepsTimelineProgress');
  var stepsTimelineLine = stepsTimelineContainer && stepsTimelineContainer.querySelector('.steps-timeline__line');

  if (stepsTimelineContainer && stepsTimelineProgress && stepsTimelineLine) {
    function measureStepsLineHeight() {
      var items = stepsTimelineContainer.querySelectorAll('.steps-timeline__item');
      if (items.length < 2) return 0;
      var firstCircle = items[0].firstElementChild;
      var lastCircle = items[items.length - 1].firstElementChild;
      if (!firstCircle || !lastCircle) return 0;
      var firstRect = firstCircle.getBoundingClientRect();
      var lastRect = lastCircle.getBoundingClientRect();
      var containerRect = stepsTimelineContainer.getBoundingClientRect();
      var startY = (firstRect.top - containerRect.top) + firstRect.height / 2;
      var endY = (lastRect.top - containerRect.top) + lastRect.height / 2;
      return { top: startY, height: endY - startY };
    }

    function applyStepsLineHeight() {
      var m = measureStepsLineHeight();
      if (m.height <= 0) return;
      stepsTimelineLine.style.top = m.top + 'px';
      stepsTimelineLine.style.height = m.height + 'px';
    }

    function updateStepsTimelineProgress() {
      var m = measureStepsLineHeight();
      if (m.height <= 0) return;
      var progress = 1;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var items = stepsTimelineContainer.querySelectorAll('.steps-timeline__item');
        var firstCircle = items[0] && items[0].firstElementChild;
        var lastCircle = items[items.length - 1] && items[items.length - 1].firstElementChild;
        if (!firstCircle || !lastCircle) {
          progress = 1;
        } else {
          var firstRect = firstCircle.getBoundingClientRect();
          var lastRect = lastCircle.getBoundingClientRect();
          var firstCenter = firstRect.top + firstRect.height / 2;
          var lastCenter = lastRect.top + lastRect.height / 2;
          var windowH = window.innerHeight;
          // Start: when step 1 is ~15% below viewport (animation begins before section is fully visible)
          var startThreshold = windowH * 1.15;
          // End: when step 3 center reaches 35% from top (wider scroll range = slower, smoother fill)
          var endThreshold = windowH * 0.35;
          // Full fill when scrolled past section, or when step 3 has reached end position
          if (lastRect.bottom <= 0 || lastCenter <= endThreshold) {
            progress = 1;
          } else if (firstCenter >= startThreshold) {
            progress = 0;
          } else {
            var range = startThreshold - endThreshold;
            progress = range <= 0 ? 1 : (startThreshold - lastCenter) / range;
            progress = Math.max(0, Math.min(1, progress));
          }
        }
      }
      stepsTimelineProgress.style.top = m.top + 'px';
      stepsTimelineProgress.style.height = (progress * m.height) + 'px';
    }

    applyStepsLineHeight();
    window.addEventListener('resize', function() {
      applyStepsLineHeight();
      updateStepsTimelineProgress();
    });
    window.addEventListener('scroll', updateStepsTimelineProgress, { passive: true });
    updateStepsTimelineProgress();
  }

  // ============================================
  // 10. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var headerOffset = 100;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

});
