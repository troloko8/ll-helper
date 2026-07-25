package com.llhelper.learning.support;

import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;

public final class LearningTestData {

    private LearningTestData() {
    }

    public static UserCardProgress defaultCardProgress() {
        UserCardProgress progress = new UserCardProgress();
        progress.setUserId(1L);
        progress.setCardId(1L);
        progress.setUserDeckProgressId(1L);
        progress.setTimesSeen(0);
        progress.setTimesCorrect(0);
        progress.setTimesWrong(0);
        progress.setCorrectStreak(0);
        progress.setStatus(CardLearningStatus.NEW);
        return progress;
    }

    public static UserDeckProgress defaultDeckProgress() {
        UserDeckProgress progress = new UserDeckProgress();
        progress.setUserId(1L);
        progress.setDeckId(1L);
        progress.setStatus(UserDeckStatus.ACTIVE);
        return progress;
    }
}
