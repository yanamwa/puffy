import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiFileText,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

import './SuperAdminSystemAnalytics.css';


/* =====================================================
   OVERVIEW CARDS
===================================================== */

const systemAnalyticsOverview = [
  {
    label: 'Platform Performance',
    value: '98%',
    detail: 'Average uptime this month',
    icon: FiActivity,
  },
  {
    label: 'User Engagement',
    value: '287',
    detail: 'Active users this week',
    icon: FiUsers,
  },
  {
    label: 'Academic Activity',
    value: '41',
    detail: 'Courses with recent learning activity',
    icon: FiBookOpen,
  },
  {
    label: 'System Usage',
    value: '5.6k',
    detail: 'Quiz and module interactions',
    icon: FiBarChart2,
  },
];


/* =====================================================
   ANALYTICS SECTIONS
===================================================== */

const systemAnalyticsSections = [
  {
    title: 'User Growth',
    description:
      'Track student, professor, and administrator registrations, active users, and account trends over time.',
    icon: FiTrendingUp,

    metrics: [
      {
        label: 'Student Registrations',
        value: '342',
        trend: '+18%',
      },
      {
        label: 'Professor Registrations',
        value: '28',
        trend: '+6%',
      },
      {
        label: 'Administrator Accounts',
        value: '5',
        trend: 'Stable',
      },
      {
        label: 'Active Users',
        value: '287',
        trend: '+12%',
      },
    ],

    bars: [
      {
        label: 'Students',
        value: 86,
      },
      {
        label: 'Professors',
        value: 64,
      },
      {
        label: 'Administrators',
        value: 36,
      },
      {
        label: 'Active accounts',
        value: 78,
      },
    ],
  },

  {
    title: 'Course Activity',
    description:
      'Monitor course creation, enrollments, module distribution, and overall course engagement.',
    icon: FiBookOpen,

    metrics: [
      {
        label: 'Courses Created',
        value: '41',
        trend: '+9%',
      },
      {
        label: 'Enrollments',
        value: '1,248',
        trend: '+21%',
      },
      {
        label: 'Modules Published',
        value: '176',
        trend: '+14%',
      },
      {
        label: 'Course Engagement',
        value: '84%',
        trend: '+7%',
      },
    ],

    bars: [
      {
        label: 'Course creation',
        value: 72,
      },
      {
        label: 'Enrollments',
        value: 92,
      },
      {
        label: 'Module distribution',
        value: 80,
      },
      {
        label: 'Engagement',
        value: 84,
      },
    ],
  },

  {
    title: 'Quiz Usage',
    description:
      'Analyze quiz attempts, completion rates, average scores, adaptive quiz usage, and assessment trends.',
    icon: FiFileText,

    metrics: [
      {
        label: 'Quiz Attempts',
        value: '5,680',
        trend: '+25%',
      },
      {
        label: 'Completion Rate',
        value: '88%',
        trend: '+8%',
      },
      {
        label: 'Average Score',
        value: '82%',
        trend: '+5%',
      },
      {
        label: 'Adaptive Quiz Usage',
        value: '64%',
        trend: '+16%',
      },
    ],

    bars: [
      {
        label: 'Attempts',
        value: 90,
      },
      {
        label: 'Completions',
        value: 88,
      },
      {
        label: 'Average scores',
        value: 82,
      },
      {
        label: 'Adaptive usage',
        value: 64,
      },
    ],
  },

  {
    title: 'Learning Progress',
    description:
      'Monitor student achievement, module completion, learning performance, and adaptive learning outcomes.',
    icon: FiTarget,

    metrics: [
      {
        label: 'Students at Mastery',
        value: '214',
        trend: '+11%',
      },
      {
        label: 'Module Completion',
        value: '79%',
        trend: '+10%',
      },
      {
        label: 'Performance Growth',
        value: '+12%',
        trend: 'Improving',
      },
      {
        label: 'Adaptive Outcomes',
        value: '91%',
        trend: '+9%',
      },
    ],

    bars: [
      {
        label: 'Achievement',
        value: 76,
      },
      {
        label: 'Module completion',
        value: 79,
      },
      {
        label: 'Performance growth',
        value: 68,
      },
      {
        label: 'Adaptive outcomes',
        value: 91,
      },
    ],
  },
];


/* =====================================================
   SYSTEM ANALYTICS PAGE
===================================================== */

export default function SuperAdminSystemAnalytics() {
  return (
    <div className="admin-page system-analytics-page">

      {/* ===============================================
          PAGE HEADER
      =============================================== */}

      <section className="system-analytics-header">
        <div>
          <span className="system-analytics-kicker">
            <FiBarChart2 aria-hidden="true" />
            System overview
          </span>

          <h1>System Analytics</h1>

          <p>
            Monitor platform performance, user engagement,
            academic activity, and overall system usage.
          </p>
        </div>
      </section>


      {/* ===============================================
          OVERVIEW
      =============================================== */}

      <section
        className="system-analytics-overview"
        aria-label="System analytics overview"
      >
        {systemAnalyticsOverview.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="system-analytics-stat"
              key={item.label}
            >
              <span aria-hidden="true">
                <Icon />
              </span>

              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          );
        })}
      </section>


      {/* ===============================================
          ANALYTICS CATEGORIES
      =============================================== */}

      <section
        className="system-analytics-grid"
        aria-label="System analytics categories"
      >
        {systemAnalyticsSections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              className="system-analytics-card"
              key={section.title}
            >
              <div className="system-analytics-card-header">
                <span aria-hidden="true">
                  <Icon />
                </span>

                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>


              <div className="system-analytics-metrics">
                {section.metrics.map((metric) => (
                  <div
                    className="system-analytics-metric"
                    key={metric.label}
                  >
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.trend}</small>
                  </div>
                ))}
              </div>


              <div className="system-analytics-bars">
                {section.bars.map((bar) => (
                  <div
                    className="system-analytics-bar"
                    key={bar.label}
                  >
                    <div>
                      <span>{bar.label}</span>
                      <strong>{bar.value}%</strong>
                    </div>

                    <i>
                      <b
                        style={{
                          width: `${bar.value}%`,
                        }}
                      />
                    </i>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

    </div>
  );
}