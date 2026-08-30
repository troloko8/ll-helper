package com.llhelper.learning.support;

import com.llhelper.common.support.TestData;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;

public final class LearningTestData {

    private LearningTestData() {
    }

    public static final Long USER_DECK_PROGRESS_ID = 10L;

    public static CardReviewRequest defaultCardReviewRequest() {
        return new CardReviewRequest("hello");
    }

    public static CardReviewRequest cardReviewRequest(String answer) {
        return new CardReviewRequest(answer);
    }

    public static CardReviewResponse defaultCardReviewResponse() {
        return new CardReviewResponse(true, "hello", CardLearningStatus.LEARNING, 1, 1);
    }

    public static CardReviewResponse cardReviewResponse(String answer, CardLearningStatus status) {
        return new CardReviewResponse(true, answer, status, 1, 1);
    }

    public static EnrollResponse defaultEnrollResponse() {
        return new EnrollResponse(USER_DECK_PROGRESS_ID);
    }

    public static EnrollResponse enrollResponse(long userDeckId) {
        return new EnrollResponse(userDeckId);
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
        progress.setEnrolledAt(TestData.fixedClock().instant());
        progress.setStatus(UserDeckStatus.ACTIVE);
        return progress;
    }
}
