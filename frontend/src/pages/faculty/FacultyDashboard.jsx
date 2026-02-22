import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { timetableApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { STATUS_BADGE, DAYS, TIME_SLOTS } from '../../utils/helpers';

export default function FacultyDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['faculty-view'],
    queryFn: () => timetableApi.getFacultyView().then((r) => r.data),
  });

  const totalSessions = data?.schedule?.reduce(
    (sum, tt) => sum + (tt.entries?.length || 0), 0
  ) ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm">Your teaching schedule for this semester</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-xl"><Calendar className="text-primary-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data?.schedule?.length || 0}</p>
            <p className="text-xs text-gray-500">Timetables</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-xl"><BookOpen className="text-purple-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalSessions}</p>
            <p className="text-xs text-gray-500">Total Sessions/Week</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-3 bg-green-50 rounded-xl"><Clock className="text-green-600" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalSessions}</p>
            <p className="text-xs text-gray-500">Hours/Week</p>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          {data?.schedule?.length === 0 && (
            <div className="card text-center py-12">
              <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-400 font-medium">No timetables assigned yet</p>
              <p className="text-gray-400 text-sm mt-1">Contact admin to generate and publish your schedule</p>
            </div>
          )}

          {data?.schedule?.map((tt) => (
            <div key={tt.timetableId} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">{tt.name}</h2>
                  <p className="text-xs text-gray-500">{tt.department} · Sem {tt.semester} · {tt.academicYear}</p>
                </div>
                <Link to={`/faculty/timetable/${tt.timetableId}`} className="btn-secondary text-sm">View Full</Link>
              </div>

              {/* Quick day overview */}
              <div className="grid grid-cols-5 gap-2">
                {DAYS.map((day) => {
                  const dayEntries = tt.entries?.filter((e) => e.day === day) || [];
                  return (
                    <div key={day} className="border border-gray-100 rounded-xl p-3 min-h-[80px]">
                      <p className="text-xs font-semibold text-gray-500 mb-2">{day.substring(0, 3)}</p>
                      {dayEntries.length === 0 && <p className="text-xs text-gray-300 text-center mt-4">Free</p>}
                      {dayEntries.map((e, i) => (
                        <div key={i} className="bg-blue-50 rounded p-1 mb-1">
                          <p className="text-xs font-medium text-blue-700 truncate">{e.course?.code}</p>
                          <p className="text-xs text-gray-400">{e.startTime}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
