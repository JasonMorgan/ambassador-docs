import React, { useMemo } from 'react';
import Button from '../../../../src/components/Button/Button';
import Icon from '../../../../src/components/Icon/Icon';
import template from '../../../../src/utils/template';
import styles from './releaseNotes.module.less';

const titlePrefix = {
  bugfix: 'Bug Fix',
  change: 'Change',
  feature: 'Feature',
  security: 'Security Update',
};

const typeIcon = {
  bugfix: 'bug',
  change: 'change',
  feature: 'tada',
  security: 'security',
};

const Note = ({ note, images, onViewMore, versions }) => {
  const title = useMemo(() => {
    if (titlePrefix[note.type]) {
      return `${titlePrefix[note.type]}: ${note.title}`;
    }
    return note.title;
  }, [note.title, note.type]);

  const image = useMemo(() => {
    if (note.image?.indexOf('://') !== -1) {
      return note.image;
    }

    const imagePath = note.image.split('./');
    if (imagePath.length > 0) {
      const imageName = imagePath.pop();
      const found = images.find(
        (img) => img.relativePath === `public/${imageName}`,
      );
      return found?.publicURL;
    }
    return null;
  }, [images, note]);

  return (
    <div className={styles.note}>
      <div className={styles.note__description}>
        <h3 className={styles.note__title} onClick={onViewMore}>
          {typeIcon[note.type] && (
            <Icon
              name={typeIcon[note.type]}
              className={styles.note__typeIcon}
            />
          )}
          <span>{title}</span>
        </h3>
        <div
          className={styles.note__body}
          dangerouslySetInnerHTML={{ __html: template(note.body, versions) }}
        />
        {image && (
          <div className={styles.note__image_xs}>
            <img src={image} alt={title} height="172" width="207" />
          </div>
        )}
      </div>
      {image && (
        <div className={styles.note__image}>
          <img src={image} alt={title} height="172" width="207" />
        </div>
      )}
    </div>
  );
};

export default Note;
