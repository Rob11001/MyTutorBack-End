const Notice = require('../models/notice');
const User = require('../models/user');
const Rating = require('../models/rating');
const Check = require('../utils/check');
const pdf = require('../utils/pdf');
const fs = require('fs');
const path = require('path');
const OK_STATUS = 200;
const ERR_CLIENT_STATUS = 412;
const ERR_SERVER_STATUS = 500;

const accessList = new Map();

accessList.set(User.Role.STUDENT, [Notice.States.PUBLISHED, Notice.States.EXPIRED, Notice.States.WAITING_FOR_GRADED_LIST, Notice.States.CLOSED]);
accessList.set(User.Role.PROFESSOR, accessList.get(User.Role.STUDENT).concat([Notice.States.IN_ACCEPTANCE, Notice.States.ACCEPTED]));
accessList.set(User.Role.DDI, accessList.get(User.Role.STUDENT).concat([Notice.States.IN_APPROVAL, Notice.States.APPROVED]));
accessList.set(User.Role.TEACHING_OFFICE, Object.values(Notice.States));

/**
 * NoticeControl
 *
 * This module represents the Notice Controller
 *
 * @module
 * @author Marco D'Antonio, Francesco Migliaro
 *
 * @copyright 2019 - Copyright by Gang Of Four Eyes
 */

/**
 *  Handles the request for the creation of a notice
 *  must be a Teaching Office to perform this action
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.create = async (req, res) => {
  const notice = req.body.notice;

  if (notice == null || await Notice.exists(notice)) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un bando valido.'});

    return;
  }

  try {
    Check.checkNotice(notice);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  return Notice.create(notice)
      .then((notice) => {
        res.status(OK_STATUS).
            send({notice: notice});
      })
      .catch((err) => {
        res.status(ERR_SERVER_STATUS).
            send({
              error: 'Creazione del bando fallita.',
              exception: err.message,
            });
      });
};

/**
 *  Handles the request for the modification of a notice
 *  must be a Teaching Office to perform this action
 *
 * @param {Request} req
 * @param {Response} res
 * @return {Promise}
 */
exports.update = async (req, res) => {
  const notice = req.body.notice;

  if (notice == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un bando valido'});

    return;
  }

  try {
    Check.checkNotice(notice);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  const dbNotices = await Notice.findByProtocol(notice.protocol);

  if (dbNotices.length != 1) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: (dbNotices.length < 1 ? 'Non esiste un bando con quel protocollo' : 'Protocollo non univoco, è stato trovato più di un bando')});

    return;
  }

  if (dbNotices[0].state !== notice.state) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Impossibile cambiare lo stato del bando, usare un\'altra interfaccia'});

    return;
  }

  return Notice.update(notice)
      .then((notice) => {
        res.status(OK_STATUS)
            .send({notice: notice});
      })
      .catch((err) => {
        res.status(ERR_SERVER_STATUS)
            .send({
              error: 'Aggiornamento del bando fallito.',
              exception: err.message,
            });
      });
};

/**
 *  Handles the request to change the Status of a notice
 *  must be a Teaching Office/Professor/DDI to perform some of these actions
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.setState = async (req, res) => {
  const userRole = req.user == null ? User.Role.STUDENT : req.user.role;
  const notice = new Notice(req.body.notice);

  if (notice == null || notice.state == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un bando valido.'});

    return;
  }

  try {
    Check.checkNoticeProtocol(notice.protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  const stateAccessList = new Map();

  stateAccessList.set(User.Role.PROFESSOR, [Notice.States.DRAFT, Notice.States.ACCEPTED]);
  stateAccessList.set(User.Role.DDI, [Notice.States.DRAFT, Notice.States.APPROVED, Notice.States.CLOSED]);
  stateAccessList.set(User.Role.TEACHING_OFFICE, [Notice.States.IN_ACCEPTANCE, Notice.States.IN_APPROVAL, Notice.States.PUBLISHED, Notice.States.WAITING_FOR_GRADED_LIST]);

  if (!stateAccessList.get(userRole).includes(notice.state)) {
    res.status(403).send();

    return;
  }

  if (notice.state === Notice.States.IN_APPROVAL) {
    try {
      const [dbNotice] = await Notice.findByProtocol(notice.protocol);
      const path = await pdf.makeNotice(dbNotice);

      notice.notice_file = path;
    } catch (err) {
      console.log(err);
      res.status(500)
          .send({
            error: 'Aggiornamento del bando fallito.',
            exception: err.message,
          });

      return;
    }
  }

  if (notice.state === Notice.States.WAITING_FOR_GRADED_LIST) {
    try {
      const [dbNotice] = await Notice.findByProtocol(notice.protocol);
      const ratings = await Rating.findByProtocol(notice.protocol);
      const path = await pdf.makeGradedList(ratings, dbNotice);

      notice.graded_list_file = path;
    } catch (err) {
      console.log(err);
      res.status(500)
          .send({
            error: 'Aggiornamento della graduatoria fallita.',
            exception: err.message,
          });

      return;
    }
  }

  try {
    const updatedNotice = await Notice.update(notice);

    return res.status(OK_STATUS).send({notice: updatedNotice});
  } catch (err) {
    res.status(500)
        .send({
          error: 'Aggiornamento del bando fallito.',
          exception: err.message,
        });

    return;
  }
};

/**
 *  Handles the request for the cancellation of a notice
 *  must be a Teaching Office to perform this action
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.delete = (req, res) => {
  const notice = req.body.notice;

  if (notice == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un bando valido.'});

    return;
  }

  try {
    Check.checkNotice(notice);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  Notice.remove(notice)
      .then((value) => {
        res.status(OK_STATUS)
            .send({result: value});
      })
      .catch((err) => {
        res.status(ERR_SERVER_STATUS)
            .send({
              error: 'Rimozione del bando fallita.',
              exception: err.message,
            });
      });
};

/**
 *  Handles the request for searching the notices
 *  different roles may perform this action, if Unauthorized, will return 403
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.search = async (req, res) => {
  const userRole = req.user == null ? User.Role.STUDENT : req.user.role;

  const protocol = req.body.protocol;
  const state = req.body.state;
  const professor = req.body.professor;
  const type = req.body.type;

  if (!protocol && !state && !professor && !type) {
    return this.findAll(req, res);
  }

  if (protocol && !state && !professor && !type) {
    req.params.protocol = protocol;

    return this.find(req, res);
  }

  if (professor && (userRole !== User.Role.PROFESSOR || userRole !== User.Role.TEACHING_OFFICE)) {
    res.status(403).send({
      error: 'Non hai i permessi per eseguire l\'operazione',
    });

    return;
  }

  const userAccessList = accessList.get(userRole);

  let notices = [];

  if (protocol) {
    notices = await Notice.findByProtocol(protocol);
    notices = notices.filter((notice) => userAccessList.includes(notice.state));
  }

  if (state) {
    if (!userAccessList.includes(state)) {
      res.status(403).send({
        error: 'Non hai i permessi per eseguire l\'operazione',
      });

      return;
    }

    if (!protocol) {
      notices = await Notice.findByState([state]);
    } else {
      notices = notices.filter((notice) => notice.state === state);
    }
  } else if (!protocol) {
    notices = await Notice.findByState(userAccessList);
  }

  if (professor) {
    professor = professor.toLowerCase();
    notices = notices.filter((notice) => notice.referent_professor.toLowerCase().includes(professor));
  }

  if (type) {
    notices = notices.filter((notice) => notice.type === type);
  }

  res.status(OK_STATUS).
      send({notices: notices});
};

/**
 *  Handles the request for the cancellation of a notice
 *  different roles may perform this action, if Unauthorized, will return 403
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.find = (req, res) => {
  const protocol = req.params.protocol;

  if (protocol == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un protocollo valido.'});

    return;
  }

  try {
    Check.checkNoticeProtocol(protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  Notice.findByProtocol(protocol)
      .then((notices) => {
        const userRole = req.user == null ? User.Role.STUDENT : req.user.role;

        const userAccessList = accessList.get(userRole);
        const authorizedNotices = notices.filter((notice) => userAccessList.includes(notice.state));

        res.send({notices: authorizedNotices});
      })
      .catch((err) => {
        res.status(ERR_SERVER_STATUS)
            .send({
              error: 'Fetch del bando fallito.',
              exception: err.message,
            });
      });
};

/**
 *  Handles the request for the retrieval of all notices
 *  different roles may perform this action
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.findAll = (req, res) => {
  const userRole = req.user == null ? User.Role.STUDENT : req.user.role;

  userAccessList = accessList.get(userRole);

  Notice.findByState(userAccessList)
      .then((notices) => {
        res.status(OK_STATUS)
            .send({notices: notices});
      })
      .catch((err) => {
        res.status(ERR_SERVER_STATUS)
            .send({
              error: 'Fetch del bando fallito.',
              exception: err.message,
            });
      });
};

exports.downloadNotice = async (req, res) => {
  let userRole = req.user.role;

  if (userRole !== User.Role.TEACHING_OFFICE && userRole !== User.Role.DDI) {
    userRole = User.Role.STUDENT;
  }

  const protocol = req.params.protocol;

  if (protocol == null || !Check.checkNoticeProtocol(protocol)) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un protocollo valido'});

    return;
  }

  try {
    Check.checkNoticeProtocol(protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  const notices = await Notice.findByProtocol(protocol);

  if (notices.length != 1) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: (notices < 1 ? 'Non esiste un bando con quel protocollo' : 'Protocollo non univoco, è stato trovato più di un bando')});

    return;
  }

  const notice = notices[0];
  const downloadAccessList = new Map();

  downloadAccessList.set(User.Role.STUDENT, [Notice.States.PUBLISHED, Notice.States.EXPIRED, Notice.States.WAITING_FOR_GRADED_LIST, Notice.States.CLOSED]);
  downloadAccessList.set(User.Role.DDI, [Notice.States.IN_APPROVAL].concat(downloadAccessList.get(User.Role.STUDENT)));
  downloadAccessList.set(User.Role.TEACHING_OFFICE, [Notice.States.IN_APPROVAL, Notice.States.APPROVED].concat(downloadAccessList.get(User.Role.STUDENT)));

  if (!downloadAccessList.get(userRole).includes(notice.state)) {
    res.status(403).send();

    return;
  }

  return res.status(OK_STATUS)
      .type('application/pdf')
      .sendFile(path.resolve(notice.notice_file));
};

exports.uploadNotice = async (req, res) => {
  const protocol = req.params.protocol;
  const noticeFile = req.body.notice;

  if (protocol == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un protocollo valido'});

    return;
  }

  try {
    Check.checkNoticeProtocol(protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  if (noticeFile == null || noticeFile.length == 0) {
    res.status(ERR_CLIENT_STATUS).send({error: 'Non è stato caricato alcun file.'});

    return;
  }

  const notices = await Notice.findByProtocol(protocol);

  if (notices.length != 1) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: (notices < 1 ? 'Non esiste un bando con quel protocollo' : 'Protocollo non univoco, è stato trovato più di un bando')});

    return;
  }

  const notice = notices[0];

  if (notice.state !== Notice.States.IN_APPROVAL) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: `Impossibile caricare il bando firmato mentre è ${notice.state}`});
  }

  try {
    fs.writeFile(notice.notice_file, Buffer.from(noticeFile, 'base64'), () => {
      res.status(OK_STATUS).send({status: true});

      return;
    });
  } catch (err) {
    console.log(err);
    res.send({error: 'Si è verificato un errore'});

    return;
  }
};

exports.downloadGradedList = async (req, res) => {
  let userRole = req.user.role;

  if (userRole !== User.Role.TEACHING_OFFICE && userRole !== User.Role.DDI) {
    userRole = User.Role.STUDENT;
  }

  const protocol = req.params.protocol;

  if (protocol == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un protocollo valido'});
  }

  try {
    Check.checkNoticeProtocol(protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  const notices = await Notice.findByProtocol(protocol);

  if (notices.length != 1) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: (notices < 1 ? 'Non esiste un bando con quel protocollo' : 'Protocollo non univoco, è stato trovato più di un bando')});
  }

  const notice = notices[0];
  const downloadAccessList = new Map();

  downloadAccessList.set(User.Role.STUDENT, [Notice.States.CLOSED]);
  downloadAccessList.set(User.Role.DDI, [Notice.States.WAITING_FOR_GRADED_LIST].concat(downloadAccessList.get(User.Role.STUDENT)));
  downloadAccessList.set(User.Role.TEACHING_OFFICE, [Notice.States.WAITING_FOR_GRADED_LIST].concat(downloadAccessList.get(User.Role.STUDENT)));

  if (!downloadAccessList.get(userRole).includes(notice.state)) {
    res.status(403).send();

    return;
  }

  return res.status(OK_STATUS)
      .type('application/pdf')
      .sendFile(path.resolve(notice.graded_list_file));
};

exports.uploadGradedList = async (req, res) => {
  const protocol = req.params.protocol;
  const gradedListFile = req.body.gradedList;

  if (protocol == null) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: 'Deve essere inserito un protocollo valido'});

    return;
  }

  try {
    Check.checkNoticeProtocol(protocol);
  } catch (error) {
    res.status(ERR_CLIENT_STATUS)
        .send({
          error: error.message,
          exception: error,
        });

    return;
  }

  if (noticeFile == null || noticeFile.length == 0) {
    res.status(ERR_CLIENT_STATUS).send({error: 'Non è stato caricato alcun file.'});

    return;
  }

  const notices = await Notice.findByProtocol(protocol);

  if (notices.length != 1) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: (notices < 1 ? 'Non esiste un bando con quel protocollo' : 'Protocollo non univoco, è stato trovato più di un bando')});

    return;
  }

  const notice = notices[0];

  if (notice.state !== Notice.States.WAITING_FOR_GRADED_LIST) {
    res.status(ERR_CLIENT_STATUS)
        .send({error: `Impossibile caricare la graduatoria firmata mentre è ${notice.state}`});
  }

  try {
    fs.writeFile(notice.graded_list_file, Buffer.from(gradedListFile, 'base64'), () => {
      res.status(OK_STATUS).send({status: true});

      return;
    });
  } catch (err) {
    console.log(err);
    res.send({error: 'Si è verificato un errore'});

    return;
  }
};
