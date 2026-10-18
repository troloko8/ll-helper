package com.llhelper.learning.service;

import com.llhelper.card.service.NewCardProgressProvisioner;
import com.llhelper.learning.repository.UserCardProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActiveEnrollmentCardProgressProvisioner implements NewCardProgressProvisioner {

    private final UserCardProgressRepository userCardProgressRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void provisionForActiveEnrollments(Long deckId, Long cardId) {
        userCardProgressRepository.insertMissingForActiveEnrollments(deckId, cardId);
    }
}
