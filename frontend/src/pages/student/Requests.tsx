import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StudentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [type, setType] = useState<'LEAVE' | 'ROOM_CHANGE'>('LEAVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
      setError(e?.message || 'Failed to load requests.');
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
      setFromDate('');
      setToDate('');
      setReasonForRoomChange('');
      setTargetRoomNumber('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave and Room Change Requests</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="space-y-3">
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as 'LEAVE' | 'ROOM_CHANGE')}
          >
            <option value="LEAVE">Leave Request</option>
            <option value="ROOM_CHANGE">Room Change</option>
          </select>

          {type === 'LEAVE' ? (
            <>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
          ) : (
            <>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Student Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Roll Number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Reason for Room Change"
                value={reasonForRoomChange}
                onChange={(e) => setReasonForRoomChange(e.target.value)}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Current Room Number"
                value={currentRoomNumber}
                onChange={(e) => setCurrentRoomNumber(e.target.value)}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Target Room Number"
                value={targetRoomNumber}
                onChange={(e) => setTargetRoomNumber(e.target.value)}
              />
            </>
          )}

          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-semibold mb-2">My Requests</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="border rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span>{r.type} - {r.title}</span>
                  <span className="font-semibold">{r.status}</span>
                </div>
                <p className="text-gray-600">{r.description}</p>
                {r.type === 'LEAVE' && r.fromDate && r.toDate && (
                  <p className="text-xs text-gray-500">
                    {new Date(r.fromDate).toLocaleString()} to {new Date(r.toDate).toLocaleString()}
                  </p>
                )}
                {r.type === 'ROOM_CHANGE' && (
                  <p className="text-xs text-gray-500">
                    {r.studentName || r.Student?.firstName} ({r.rollNumber || r.Student?.studentId}) | {r.currentRoomNumber || 'N/A'} to {r.targetRoomNumber || 'N/A'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
