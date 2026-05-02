package com.llhelper.card_desc.mapper;

// TODO: advanced feature — mapper will be re-enabled later
//import com.llhelper.card.mapper.CardMapper;
//import com.llhelper.carddesc.dto.response.CardDescResponse;
//import com.llhelper.carddesc.entity.CardDesc;
//import org.springframework.stereotype.Component;
//
//@Component
//public class CardDescMapper {
//
//    private final CardMapper cardMapper;
//
//    public CardDescMapper(CardMapper cardMapper) {
//        this.cardMapper = cardMapper;
//    }
//
//    public CardDescResponse toResponse(CardDesc cardDesc) {
//        return new CardDescResponse(
//            cardDesc.getId(),
//            cardDesc.getTitle(),
//            cardDesc.getDescription(),
//            cardDesc.getCreatedAt(),
//            cardDesc.getUpdatedAt(),
//            cardDesc.getCards().stream().map(cardMapper::toResponse).toList()
//        );
//    }
//}
