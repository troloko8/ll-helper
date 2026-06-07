package com.llhelper.card.entity;

import com.llhelper.card_desc.entity.CardDesc;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "cards")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "synonyms", columnDefinition = "text[]")
    private List<String> synonyms;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "examples", columnDefinition = "text[]")
    private List<String> examples;

    @Column
    private String translation;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "card_desc_id", insertable = false, updatable = false)
    private Long cardDescId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_desc_id", nullable = false)
    private CardDesc cardDesc;
}
