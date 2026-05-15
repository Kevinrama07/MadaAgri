import { FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi';
import clsx from 'clsx';
import styles from '../../styles/Composants/EventsWidget.module.css';

export default function EventsWidget() {
  const events = [
    {
      id: 1,
      title: 'Formation sur la culture du riz',
      date: '15 Jan',
      time: '09:00',
      location: 'Antananarivo',
      attendees: 45,
      color: '#22c55e'
    },
    {
      id: 2,
      title: 'Marché agricole hebdomadaire',
      date: '18 Jan',
      time: '06:00',
      location: 'Antsirabe',
      attendees: 120,
      color: '#3b82f6'
    },
    {
      id: 3,
      title: 'Conférence sur l\'irrigation',
      date: '22 Jan',
      time: '14:00',
      location: 'Fianarantsoa',
      attendees: 78,
      color: '#f59e0b'
    }
  ];

  return (
    <div className={clsx(styles['events-widget'])}>
      <div className={clsx(styles['widget-header'])}>
        <h3 className={clsx(styles['widget-title'])}>Événements à venir</h3>
        <button className={clsx(styles['see-all-btn'])}>Voir tout</button>
      </div>

      <div className={clsx(styles['events-list'])}>
        {events.map((event) => (
          <div key={event.id} className={clsx(styles['event-item'])}>
            <div 
              className={clsx(styles['event-date'])}
              style={{ background: event.color }}
            >
              <span className={clsx(styles['date-day'])}>{event.date.split(' ')[0]}</span>
              <span className={clsx(styles['date-month'])}>{event.date.split(' ')[1]}</span>
            </div>

            <div className={clsx(styles['event-details'])}>
              <h4 className={clsx(styles['event-title'])}>{event.title}</h4>
              
              <div className={clsx(styles['event-meta'])}>
                <span className={clsx(styles['meta-item'])}>
                  <FiClock size={12} />
                  {event.time}
                </span>
                <span className={clsx(styles['meta-item'])}>
                  <FiMapPin size={12} />
                  {event.location}
                </span>
              </div>

              <div className={clsx(styles['event-attendees'])}>
                <FiUsers size={14} />
                <span>{event.attendees} participants</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className={clsx(styles['create-event-btn'])}>
        <FiCalendar />
        Créer un événement
      </button>
    </div>
  );
}
