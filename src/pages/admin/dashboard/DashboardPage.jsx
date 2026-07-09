import { FiBookOpen, FiUser, FiUsers } from 'react-icons/fi';
import './Dashboard.css';

const stats = [
  { id: 1, label: 'Total Users', value: '15', badge: 'Live', icon: FiUsers },
  { id: 2, label: 'Total Decks', value: '14', badge: 'Live', icon: FiBookOpen },
  { id: 3, label: 'Recent Decks', value: '5', badge: 'Latest', icon: FiBookOpen },
];

const recentDecks = [
  { id: 1, title: 'reviewer for mapeh', author: 'Created by @puffybrain' },
  { id: 2, title: 'HCI 3', author: 'Created by @nighjri' },
  { id: 3, title: 'dadawd', author: 'Created by @meiko' },
  { id: 4, title: 'Introduction to js', author: 'Created by @meiko' },
  { id: 5, title: 'Testing', author: 'Created by @meiko' },
];

const recentUsers = [
  { id: 1, name: '@puffybrain', role: 'Recent user' },
  { id: 2, name: '@anie', role: 'Recent user' },
  { id: 3, name: '@Ashbornn', role: 'Recent user' },
  { id: 4, name: '@shzume', role: 'Recent user' },
  { id: 5, name: '@ads', role: 'Recent user' },
];

export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="stat-cards">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.id}>
              <div className="stat-icon">
                <Icon />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <span className="stat-change">{stat.badge}</span>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-sections">
        <section className="section">
          <div className="section-header">
            <h2>Recent Created Decks</h2>
            <a href="#" className="show-all">Show all</a>
          </div>
          <div className="decks-list">
            {recentDecks.map((deck) => (
              <div key={deck.id} className="deck-item">
                <span className="deck-icon">
                  <FiBookOpen />
                </span>
                <div className="deck-info">
                  <p className="deck-title">{deck.title}</p>
                  <p className="deck-author">{deck.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <a href="#" className="show-all">Show all</a>
          </div>
          <div className="users-list">
            {recentUsers.map((user) => (
              <div key={user.id} className="user-item">
                <span className="recent-user-avatar">
                  <FiUser />
                </span>
                <div className="user-info">
                  <p className="user-name">{user.name}</p>
                  <p className="recent-user-role">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
