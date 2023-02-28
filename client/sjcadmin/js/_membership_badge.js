const membershipBadge = Document => function (badges, record) {
    switch (record.membership) {
        case 'licenced':
            if (record.licence.exp) {
                return badges.danger(Document.createTextNode('Expired'));
            }

            return badges.success(Document.createTextNode('Licenced'));
        case 'trial':
            if (record.rem_trial_sessions <= 0) {
                return badges.danger(Document.createTextNode('Expired'));
            }

            return badges.warning(Document.createTextNode('Trial'));
    }
}

const membershipIndex = (record) => {
    if ((record.membership === 'licenced' && record.licence.exp) || (record.membership === 'trial' && record.rem_trial_sessions <= 0)) {
        return 2;
    }

    return record.membership === 'trial' ? 1 : 0;
};

export { membershipBadge, membershipIndex }

