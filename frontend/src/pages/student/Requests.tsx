import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const formatDateTimeLocal = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultLeaveWindow = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    from: formatDateTimeLocal(start),
    to: formatDateTimeLocal(end)
  };
};

const parseDateTimeLocalValue = (value: string): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? null : time;
};

export default function StudentRequests() {
  const defaultLeaveWindow = getDefaultLeaveWindow();
  const [requests, setRequests] = useState<any[]>([]);
  const [type, setType] = useState<'LEAVE' | 'ROOM_CHANGE'>('LEAVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState(defaultLeaveWindow.from);
  const [toDate, setToDate] = useState(defaultLeaveWindow.to);
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [reasonForRoomChange, setReasonForRoomChange] = useState('');
  const [currentRoomNumber, setCurrentRoomNumber] = useState('');
  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [requestsRes, profileRes, roomRes] = await Promise.all([
        studentApi.getRequests(),
        studentApi.getProfile(),
        studentApi.getRoom()
      ]);
      setRequests(requestsRes.requests || []);

      if (profileRes?.student) {
        const profile = profileRes.student;
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
        setStudentName((prev) => prev || fullName);
        setRollNumber((prev) => prev || profile.studentId || '');
      }

      if (roomRes?.room?.roomNumber) {
        setCurrentRoomNumber((prev) => prev || roomRes.room.roomNumber);
      }
      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load requests.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (type === 'LEAVE') {
        if (!fromDate || !toDate || !title.trim() || !description.trim()) {
          setError('Leave request requires Start Date & Time, End Date & Time, Title, and Description.');
          return;
        }

        const parsedFromDate = parseDateTimeLocalValue(fromDate);
        const parsedToDate = parseDateTimeLocalValue(toDate);

        if (parsedFromDate === null || parsedToDate === null) {
          setError('Please enter valid Start Date & Time and End Date & Time.');
          return;
        }

        if (parsedFromDate >= parsedToDate) {
          setError('End Date & Time must be after Start Date & Time.');
          return;
        }

        await studentApi.submitRequest({
          type,
          title: title.trim(),
          description: description.trim(),
          fromDate,
          toDate
        });
      } else {
        if (
          !studentName.trim() ||
          !rollNumber.trim() ||
          !reasonForRoomChange.trim() ||
          !currentRoomNumber.trim() ||
          !targetRoomNumber.trim()
        ) {
          setError('Room Change request requires Student Name, Roll Number, Reason, Current Room Number, and Target Room Number.');
          return;
        }

        await studentApi.submitRequest({
          type,
          title: `Room Change Request - ${rollNumber.trim()}`,
          description: reasonForRoomChange.trim(),
          studentName: studentName.trim(),
          rollNumber: rollNumber.trim(),
          reasonForRoomChange: reasonForRoomChange.trim(),
          currentRoomNumber: currentRoomNumber.trim(),
          targetRoomNumber: targetRoomNumber.trim()
        });
      }

      setTitle('');
      setDescription('');
      const nextLeaveWindow = getDefaultLeaveWindow();
      setFromDate(nextLeaveWindow.from);
      setToDate(nextLeaveWindow.to);
      setReasonForRoomChange('');
      setTargetRoomNumber('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave & Room Change Requests</h1>
        <p className="text-gray-600 mt-1">Submit and track your leave applications and room change requests</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Submit New Request */}
      <Card>
        <CardContent>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-900">📝 Submit New Request</h2>
            </div>

            {/* Request Type Selection */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Request Type <span className="text-red-600">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className={`px-6 py-4 border-2 rounded-lg font-semibold transition-all ${
                    type === 'LEAVE'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setType('LEAVE')}
                >
                  🏖️ Leave Request
                </button>
                <button
                  className={`px-6 py-4 border-2 rounded-lg font-semibold transition-all ${
                    type === 'ROOM_CHANGE'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setType('ROOM_CHANGE')}
                >
                  🔄 Room Change
                </button>
              </div>
            </div>

            {/* Leave Request Form */}
            {type === 'LEAVE' && (
              <div className="space-y-4 bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">🏖️ Leave Request Details</h3>
                
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    Start Date & Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    value={fromDate}
                    onChange={(e) => {
                      const nextFromDate = e.target.value;
                      setFromDate(nextFromDate);

                      const fromTime = parseDateTimeLocalValue(nextFromDate);
                      const toTime = parseDateTimeLocalValue(toDate);
                      if (fromTime !== null && toTime !== null && toTime <= fromTime) {
                        const nextToDate = formatDateTimeLocal(new Date(fromTime + 60 * 60 * 1000));
                        setToDate(nextToDate);
                      }
                    }}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    End Date & Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="e.g., Medical Leave, Family Emergency"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    placeholder="Provide detailed reason for leave request"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Room Change Form */}
            {type === 'ROOM_CHANGE' && (
              <div className="space-y-4 bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3">🔄 Room Change Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">
                      Student Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">
                      Roll Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Your roll number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    Reason for Room Change <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    placeholder="Explain why you need to change your room"
                    rows={4}
                    value={reasonForRoomChange}
                    onChange={(e) => setReasonForRoomChange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">
                      Current Room Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., 101"
                      value={currentRoomNumber}
                      onChange={(e) => setCurrentRoomNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">
                      Target Room Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., 205"
                      value={targetRoomNumber}
                      onChange={(e) => setTargetRoomNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={submit} disabled={submitting} size="lg">
                {submitting ? '📤 Submitting...' : '📤 Submit Request'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Requests */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 My Requests</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">No requests found. Submit your first request above!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const statusColors: Record<string, string> = {
                PENDING: 'bg-yellow-100 text-yellow-700',
                APPROVED: 'bg-green-100 text-green-700',
                REJECTED: 'bg-red-100 text-red-700'
              };

              return (
                <Card key={r.id}>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{r.type === 'LEAVE' ? '🏖️' : '🔄'}</span>
                            <h3 className="text-lg font-semibold text-gray-900">{r.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600">{r.type === 'LEAVE' ? 'Leave Request' : 'Room Change Request'}</p>
                        </div>
                        <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${
                          statusColors[r.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-900">{r.description}</p>
                      </div>

                      {/* Additional Details */}
                      {r.type === 'LEAVE' && r.fromDate && r.toDate && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-700 font-semibold mb-1">Start Date & Time</p>
                            <p className="text-blue-900">{new Date(r.fromDate).toLocaleString()}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-purple-700 font-semibold mb-1">End Date & Time</p>
                            <p className="text-purple-900">{new Date(r.toDate).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {r.type === 'ROOM_CHANGE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-700 font-semibold mb-1">Student</p>
                            <p className="text-blue-900">
                              {r.studentName || `${r.Student?.firstName} ${r.Student?.lastName}`}
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                              Roll: {r.rollNumber || r.Student?.studentId}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-purple-700 font-semibold mb-1">Room Change</p>
                            <p className="text-purple-900">
                              {r.currentRoomNumber || 'N/A'} → {r.targetRoomNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
