const pool = require('../db');

const table = 'document';
/**
 * Document
 *
 * This class represents a Document
 *
 * @author Francesco Migliaro
 *
 * @copyright 2019 - Copyright by Gang Of Four Eyes
 */
class Document {
  /**
   * Document object constructor
   * @param {Document} aDocument The JS object that contains fields for setting new Document object
   */
  constructor(aDocument) {
    this.student = aDocument.student;
    this.notice_protocol = aDocument.notice_protocol;
    this.file_name = aDocument.file_name;
    this.file = aDocument.file;
  }

  /**
   * Creates a new document in database.
   * @param {Document} aDocument The document to save.
   * @param {Candidature} candidature The candidature correlates to the document.
   * @return {Promise<Document>} Promise that represents the created document.
   */
  static create(aDocument, candidature) {
    aDocument.notice_protocol = candidature.notice_protocol;
    aDocument.student = candidature.student;

    return pool.query(`INSERT INTO ${table} SET ?`, aDocument)
        .then(() => {
          return new Document(aDocument);
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Updates a document in database.
   * @param {Document} aDocument The document to update.
   * @param {Candidature} candidature The candidature correlates to the document.
   * @return {Promise<Document>} Promise that represents the updated document.
   */
  static update(aDocument, candidature) {
    aDocument.notice_protocol = candidature.notice_protocol;
    aDocument.student = candidature.student;

    return pool.query(`UPDATE ${table} SET ? WHERE student = ? 
                                              AND notice_protocol = ? 
                                              AND file_name = ?`,
    [aDocument, aDocument.student, aDocument.notice_protocol, aDocument.file_name])
        .then(() => {
          return new Document(aDocument);
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
 * Removes a document in database.
 * @param {Document} aDocument The document to remove.
 * @param {Candidature} candidature The candidature correlates to the document.
 * @return {Promise<boolean>} Promise that represents the value of the action.
 */
  static remove(aDocument, candidature) {
    return pool.query(`DELETE FROM ${table} WHERE student = ?
                                              AND notice_protocol = ?
                                              AND file_name = ?`,
    [candidature.student, candidature.notice_protocol, aDocument.file_name])
        .then(([resultSetHeader]) => {
          return resultSetHeader.affectedRow > 0;
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Checks if a document exists.
   * @param {Document} aDocument The document to check.
   * @param {Candidature} candidature The candidature correlates to the document.
   * @return {Promise<boolean>} Promise that represents the value of the action.
   */
  static exists(aDocument, candidature) {
    return pool.query(`SELECT FROM ${table} WHERE student = ?
                                              AND notice_protocol = ?
                                              AND file_name = ?`,
    [candidature.student, candidature.notice_protocol, aDocument.file_name])
        .then(([rows]) => {
          return rows.lenght > 0;
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Finds the document with the specific id.
   * @param {string} name The filename of the document.
   * @param {string} studentEmail The email of the student correlate to the document.
   * @param {string} noticeProtocol The protocol of the notice correlate to the document.
   * @return {Promise<Document>} Promise that represents the document.
   */
  static findById(name, studentEmail, noticeProtocol) {
    return pool.query(`SELECT * FROM ${table} WHERE student = ?
                                                AND notice_protocol = ?
                                                AND file_name = ?`,
    [studentEmail, noticeProtocol, name])
        .then(([rows]) => {
          return new Document(rosw[0]);
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Finds the documents correlate to a specific notice.
   * @param {string} noticeProtocol The protocol of the notice.
   * @return {Promise<Document[]>} Promise that respresents the Documents correlated to the specific notice.
   */
  static findByNotice(noticeProtocol) {
    return pool.query(`SELECT * FROM ${table} WHERE notice_protocol = ?`, noticeProtocol)
        .then(([rows]) => {
          return rows.map((el) => new Document(el));
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Finds the documents correlate to a specific candidature.
   * @param {Candidature} candidature The candidature.
   * @return {Promise<Document[]>} Promise that respresents the Documents correlated to the specific candidature.
   */
  static findByCandidature(candidature) {
    return pool.query(`SELECT FROM ${table} WHERE student = ?
                                              AND notice_protocol = ?`,
    [candidature.student, candidature.notice_protocol])
        .then(([rows]) => {
          return rows.map((el) => new Document(el));
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Finds the documents correlate to a specific student.
   * @param {string} studentEmail The email of the student.
   * @return {Promise<Document[]>} Promise that respresents the Documents correlated to the specific student.
   */
  static findByStudent(studentEmail) {
    return pool.query(`SELECT FROM ${table} WHERE student = ?`, studentEmail)
        .then(([rows]) => {
          return rows.map((el) => new Document(el));
        })
        .catch((err) => {
          throw err.message;
        });
  }

  /**
   * Finds all the documents.
   * @return {Promise<Document[]>} Promise that respresents all the Documents.
   */
  static findAll() {
    return pool.query(`SELECT FROM ${table}`)
        .then(([rows]) => {
          return rows.map((el) => new Document(el));
        })
        .catch((err) => {
          throw err.message;
        });
  }
}


module.exports = Document;
