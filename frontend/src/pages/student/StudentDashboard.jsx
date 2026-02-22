import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, ExternalLink, GraduationCap, ClipboardList } from 'lucide-react';
import { DAYS, TIME_SLOTS } from '../../utils/helpers';

const SESSION_COLORS = {
  LECTURE: 'bg-blue-50 border-l-2 border-blue-400',
  PRACTICAL: 'bg-purple-50 border-l-2 border-purple-400',
  TUTORIAL: 'bg-green-50 border-l-2 border-green-400',
};

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [selectedSem, setSelectedSem] = useState(user?.semester || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-timetable', user?.id, user?.department, selectedSem],
    queryFn: () => studentApi.getTimetable(
      selectedSem ? { semester: selectedSem, department: user?.department } : { department: user?.department }
    ).then((r) => r.data),
    enabled: !!user,
  });

  const tt = data?.timetable;

  // Build day view
  const daySchedule = {};
  DAYS.forEach((d) => { daySchedule[d] = []; });
  tt?.schedule?.forEach((e) => {
    if (daySchedule[e.day]) daySchedule[e.day].push(e);
  });

  DAYS.forEach((d) => {
    daySchedule[d].sort((a, b) => a.timeSlotId - b.timeSlotId);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-500 text-sm">
            {user?.department}
            {tt ? ` · Semester ${tt.semester} · ${tt.academicYear}` : ` · Semester ${user?.semester}`}
            {user?.division && ` · Division ${user?.division}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Semester:</label>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value ? Number(e.target.value) : '')}
            className="input-field !py-1.5 !text-sm w-32"
          >
            <option value="">All</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
        </div>
        {tt && !tt._noRegistrations && (
          <Link to={`/student/timetable/${tt._id}`} className="btn-primary flex items-center gap-2 text-sm w-fit">
            <ExternalLink size={14} /> Full View
          </Link>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          {error && (
            <div className="card text-center py-16">
              <GraduationCap className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-400 font-medium">No timetable published yet</p>
              <p className="text-gray-400 text-sm mt-1">Your department timetable will appear here once published by admin</p>
            </div>
          )}

          {tt?._noRegistrations && (
            <div className="card text-center py-16">
              <ClipboardList className="mx-auto text-amber-300 mb-3" size={48} />
              <p className="text-gray-700 font-semibold text-lg">No courses registered</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                Register for your courses first to see your personalised timetable.
              </p>
              <Link to="/student/register" className="btn-primary inline-flex items-center gap-2 text-sm">
                <ClipboardList size={14} /> Go to Course Registration
              </Link>
            </div>
          )}

          {tt && !tt._noRegistrations && (
            <>
              {/* Timetable info banner */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="text-primary-600 shrink-0" size={22} />
                <div>
                  <p className="font-semibold text-primary-800">{tt.name}</p>
                  <p className="text-primary-600 text-xs mt-0.5">{tt.schedule?.length} sessions/week · Academic Year {tt.academicYear}</p>
                </div>
              </div>

              {/* Day-by-day cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {DAYS.map((day) => (
                  <div key={day} className="card">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>{day}</span>
                      <span className="badge badge-gray text-xs">{daySchedule[day].length} sessions</span>
                    </h3>
                    {daySchedule[day].length === 0 && (
                      <p className="text-gray-300 text-sm text-center py-4">No classes</p>
                    )}
                    <div className="space-y-2">
                      {daySchedule[day].map((entry, i) => {
                        const slotDef = TIME_SLOTS.find((s) => s.id === entry.timeSlotId);
                        return (
                          <div key={i} className={`${SESSION_COLORS[entry.sessionType] || SESSION_COLORS.LECTURE} rounded-lg p-3`}>
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">{entry.course?.code}</p>
                                <p className="text-xs text-gray-600 truncate">{entry.course?.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{entry.faculty?.name}</p>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="text-xs font-medium text-gray-600">{entry.startTime}</p>
                                <p className="text-xs text-gray-400">{entry.room?.roomNumber}</p>
                                {entry.duration > 1 && <span className="badge badge-purple text-xs">{entry.duration}hr</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
