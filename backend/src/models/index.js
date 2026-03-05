const User = require('./User');
const Student = require('./Student');
const Room = require('./Room');
const Allocation = require('./Allocation');
const Complaint = require('./Complaint');
const Menu = require('./Menu');
const Hostel = require('./Hostel');
const Application = require('./Application');
const Request = require('./Request');
const Attendance = require('./Attendance');
const Payment = require('./Payment');
const Visitor = require('./Visitor');
const WardenMessage = require('./WardenMessage');

// Set up associations
User.hasMany(Hostel, { foreignKey: 'wardenId', as: 'assignedHostels', constraints: false });
Hostel.belongsTo(User, { foreignKey: 'wardenId', as: 'warden', constraints: false });

Hostel.hasMany(Room, { foreignKey: 'hostelId', as: 'rooms', constraints: false });
Room.belongsTo(Hostel, { foreignKey: 'hostelId', as: 'hostel', constraints: false });

WardenMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender', constraints: false });
WardenMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver', constraints: false });

module.exports = {
  User,
  Student,
  Room,
  Allocation,
  Complaint,
  Menu,
  Hostel,
  Application,
  Request,
  Attendance,
  Payment,
  Visitor,
  WardenMessage
};
