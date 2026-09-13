'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import useMilestones from '@/hooks/milestones/useMilestones';
import { DiffPeriod, StoredMilestone } from '@/lib/types/milestones';
import UpdateMilestoneModal from './UpdateMilestoneModal';
import DeleteMilestoneModal from './DeleteMilestoneModal';
const periods: DiffPeriod[] = ['weeks', 'days', 'hours', 'minutes', 'seconds'];
const milliseconds = {
  weeks: 604800000,
  days: 86400000,
  hours: 3600000,
  minutes: 60000,
  seconds: 1000,
};
const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
type Props = Pick<
  ReturnType<typeof useMilestones>,
  'store' | 'updateMilestone' | 'deleteMilestone'
>;

// One clock keeps labels and proportional bars in agreement after edits and unit changes.
export default function MilestonesComparison({
  store,
  updateMilestone,
  deleteMilestone,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const unit = store.config.diffPeriod;
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(
      () => setNow(Date.now()),
      unit === 'seconds' ? 1000 : 10000
    );
    return () => clearInterval(timer);
  }, [unit]);
  const visible = store.milestones.filter(
    (m) => !store.hiddenMilestoneIds.includes(m.publicId)
  );
  const hidden = store.milestones.filter((m) =>
    store.hiddenMilestoneIds.includes(m.publicId)
  );
  const past = Math.max(0, ...visible.map((m) => now - m.timestamp));
  const future = Math.max(0, ...visible.map((m) => m.timestamp - now));
  // A single span gives equal durations equal widths on either side of now.
  const span = past + future;
  const origin = span === 0 ? 50 : (past / span) * 100;
  const count = (duration: number) =>
    number.format(
      unit === 'weeks'
        ? Math.round((duration / milliseconds[unit]) * 100) / 100
        : Math.ceil(duration / milliseconds[unit])
    );
  const date = (m: StoredMilestone) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: m.timezone,
    }).format(m.timestamp);
  const actions = (m: StoredMilestone) => (
    <div className='milestones-actions'>
      <button
        className='milestones-eye'
        aria-label={`${store.hiddenMilestoneIds.includes(m.publicId) ? 'Show' : 'Hide'} ${m.name} in comparison`}
        onClick={() =>
          store.hiddenMilestoneIds.includes(m.publicId)
            ? store.unhideMilestone(m.publicId)
            : store.hideMilestone(m.publicId)
        }
      >
        {store.hiddenMilestoneIds.includes(m.publicId) ? (
          <EyeOff size={17} />
        ) : (
          <Eye size={17} />
        )}
      </button>
      <UpdateMilestoneModal
        existingMilestone={m}
        updateMilestone={updateMilestone}
        trigger={
          <button
            className='milestones-text-action'
            aria-label={`Edit ${m.name}`}
          >
            Edit
          </button>
        }
      />
      <DeleteMilestoneModal
        milestonePublicId={m.publicId}
        milestoneName={m.name}
        deleteMilestone={deleteMilestone}
        trigger={
          <button
            className='milestones-text-action'
            aria-label={`Delete ${m.name}`}
          >
            Delete
          </button>
        }
      />
    </div>
  );
  const label = (m: StoredMilestone) => (
    <div className='milestones-event-name'>
      <span className='milestones-swatch' style={{ background: m.color }} />
      <div>
        <h3>{m.name}</h3>
        <p>{date(m)}</p>
      </div>
    </div>
  );
  const countdown = (m: StoredMilestone) => (
    <div className='milestones-count'>
      <strong>{count(Math.abs(m.timestamp - now))}</strong>
      <span>
        {unit} {m.timestamp < now ? 'ago' : 'to go'}
      </span>
    </div>
  );
  return (
    <>
      <section
        className='milestones-comparison'
        aria-label='Milestone comparison'
      >
        <div className='milestones-toolbar'>
          <h2>
            Your time, in <span>{unit}</span>
          </h2>
          <div className='milestones-units' aria-label='Countdown unit'>
            {periods.map((period) => (
              <button
                key={period}
                aria-pressed={unit === period}
                onClick={() => store.setDiffPeriod(period)}
              >
                {period[0].toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {visible.length > 0 && (
          <div className='milestones-scale'>
            <div className='milestones-directions'>
              <span>{past > 0 && `Past · ${count(past)} ${unit}`}</span>
              <span>{future > 0 && `Future · ${count(future)} ${unit}`}</span>
            </div>
            <div className='milestones-axis-label'>
              <span
                style={{
                  left: `${origin}%`,
                  transform: `translateX(-${origin}%)`,
                }}
              >
                Now
              </span>
            </div>
          </div>
        )}
        <div className='milestones-rows'>
          {visible.map((m) => (
            <article className='milestones-row' key={m.publicId}>
              <div className='milestones-row-info'>
                {label(m)}
                {countdown(m)}
                {actions(m)}
              </div>
              <div className='milestones-track' aria-hidden='true'>
                <div
                  className='milestones-bar'
                  style={{
                    left: `${span === 0 ? origin : ((past + Math.min(0, m.timestamp - now)) / span) * 100}%`,
                    width: `${span === 0 ? 0 : (Math.abs(m.timestamp - now) / span) * 100}%`,
                    background: m.color,
                  }}
                />
                <span
                  className='milestones-now-line'
                  style={{ left: `${origin}%` }}
                />
              </div>
            </article>
          ))}
          {!visible.length && (
            <p className='milestones-empty'>
              {store.milestones.length
                ? 'All milestones are hidden. Show one below to compare.'
                : 'Add your first milestone to see how much time there is to go.'}
            </p>
          )}
        </div>
        {visible.length > 0 && (
          <div className='milestones-chart-footer'>
            <span>
              <span className='milestones-origin' /> Past extends left · Future
              extends right
            </span>
            <span>Bar lengths share the same scale</span>
          </div>
        )}
      </section>
      {hidden.length > 0 && (
        <section className='milestones-hidden' aria-label='Hidden milestones'>
          <div className='milestones-hidden-heading'>
            <h2>Outside this comparison</h2>
            <span>Show a milestone to put it back in perspective.</span>
          </div>
          <div className='milestones-hidden-cards'>
            {hidden.map((m) => (
              <article key={m.publicId} className='milestones-hidden-card'>
                {label(m)}
                {countdown(m)}
                {actions(m)}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
