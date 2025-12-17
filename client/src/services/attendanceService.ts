import api from './api';
 
export interface WeeklyStat {
  name: string;
  attendance: number;
  absence: number;
  total: number;
}
 
export interface AttendanceStats {
  today_count: number;
  total_students: number;
  total_classes: number;
  weekly_stats: WeeklyStat[];
}
 
export const getAttendanceStats = async (): Promise<AttendanceStats> => {
  const response = await api.get<AttendanceStats>('/attendance/stats');
  return response.data;
};

export const triggerTraining = async (): Promise<{ status: string; message: string }> => {
  const response = await api.post('/attendance/train');
  return response.data;
};
