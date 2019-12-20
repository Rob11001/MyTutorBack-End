const pool = require('../db');

const table = 'comment';
/**
 * Comment
 *
 * This class represents a Comment
 *
 * @author Francesco Migliaro, Roberto Bruno
 * @version
 * @since
 *
 * @copyright 2019 - Copyright by Gang Of Four Eyes
 */
class Comment {
  /**
   * Comment object constructor
   * @param {Comment} comment The JS object that contains field for setting new Comment object
   */
  constructor(comment) {
    this.notice = comment.notice;
    this.author = comment.author;
    this.text = comment.text;
  }

  /**
   * Creates a new Comment.
   * @param {Comment} comment The comment to save.
   * @return {Promise<Comment>} Promise object that represents the created comment.
   */
  static create(comment) {
    if (comment === null ) {
      return null;
    }
    return pool.query(`INSERT INTO ${table} SET ?`, comment)
        .then(([resultSetHeader]) => {
          return comment;
        })
        .catch((err) => {
          throw err;
        });
  }

  /**
   * Updates a Comment
   * @param {Comment} comment The comment to save.
   * @return {Promise<Comment>} Promise object that represents the updated comment.
   */
  static update(comment) {
    if (comment === null) {
      return null;
    }
    return pool.query(`UPDATE ${table} SET ? WHERE notice = ?`, [comment, comment.notice])
        .then(([resultSetHeader]) => comment)
        .catch((err) => {
          throw err;
        });
  }

  /**
   * Removes a Comment from database
   * @param {Comment} comment The comment to remove.
   * @return {Promise<boolean>}  Promise that is true if the removal went right else it's false.
   */
  static remove(comment) {
    if (comment === null) {
      return null;
    }
    return pool.query(`DELETE FROM ${table} WHERE notice = ?`, comment.notice)
        .then(([resultSetHeader]) => resultSetHeader.affectedRows > 0)
        .catch((err) => {
          throw err;
        });
  }

  /**
   * Checks if a comment exists.
   * @param {Comment} comment The comment to check.
   * @return {Promise<boolean>} Promise that is true if the comment exists in the db, else it's false
   */
  static exists(comment) {
    if (comment === null) {
      return null;
    }
    return pool.query(`SELECT * FROM ${table} WHERE notice = ?`, comment.notice)
        .then(([rows]) => rows.lenght > 0)
        .catch((err) => {
          throw err;
        });
  }
  /**
   * Finds the comment of the specified notice.
   * @param {string} noticeProtocol The protocol of the notice.
   * @return {Promise<Comment>} Promise object that represents the Comment of the passed notice.
   */
  static findByProtocol(noticeProtocol) {
    if (noticeProtocol === null) {
      return null;
    }
    return pool.query(`SELECT * FROM ${table} WHERE notice = ?`, noticeProtocol)
        .then(([rows]) => new Comment(rows[0]))
        .catch((err) => {
          throw err;
        });
  }

  /**
   * Finds all the comments
   * @return {Promise<Comment[]>} Promise object that represents the list of all Comments.
   */
  static findAll() {
    return pool.query(`SELECT * FROM ${table}`)
        .then(([rows]) => rows.map((c) => new Comment(c)))
        .catch((err) => {
          throw err;
        });
  }
}

module.exports = Comment;
