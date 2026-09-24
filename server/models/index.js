/**
 * models/index.js
 *
 * Central import hub for all Sequelize models.
 * Importing this file guarantees every model is registered with the Sequelize
 * instance and all associations are declared before any query runs.
 *
 * server.js imports this once at boot:
 *   import './models/index.js';
 *
 * Individual controllers/models continue to import directly from their own
 * files — this file exists purely to ensure everything is loaded at startup.
 */

import sequelize from '../config/sequelize.js';

import User          from './User.js';
import Project,      { Milestone }   from './Project.js';
import Message       from './Message.js';
import Ticket,       { TicketReply } from './Ticket.js';
import Invoice       from './Invoice.js';
import Notification  from './Notification.js';

// ─── All associations are declared inside each model file ─────────────────────
// This file just ensures they're all imported (and thus registered) together.

export { sequelize, User, Project, Milestone, Message, Ticket, TicketReply, Invoice, Notification };
