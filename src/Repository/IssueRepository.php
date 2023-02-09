<?php

namespace App\Repository;

use App\Entity\ContentItem;
use App\Entity\Course;
use App\Entity\Issue;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Issue|null find($id, $lockMode = null, $lockVersion = null)
 * @method Issue|null findOneBy(array $criteria, array $orderBy = null)
 * @method Issue[]    findAll()
 * @method Issue[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class IssueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Issue::class);
    }

    public function getDeletableContentItemIssues(ContentItem $contentItem, Issue $currentIssue = null)
    {
        $qb = $this->createQueryBuilder('i');

        if ($currentIssue) {
            $qb->where('i.contentItem = ?1 AND i.status = ?2 AND i.id != ?3')
            ->setParameters([
                1 => $contentItem,
                2 => Issue::$issueStatusActive,
                3 => $currentIssue->getId()
            ]);
        } else {
            $qb->where('i.contentItem = ?1 AND i.status = ?2')
            ->setParameters([
                1 => $contentItem,
                2 => Issue::$issueStatusActive
            ]);
        }

        return $qb->getQuery()->getResult();
    }

    public function deleteContentItemIssues(ContentItem $contentItem, Issue $currentIssue = null)
    {
        $qb = $this->getEntityManager()->createQueryBuilder()
            ->delete(Issue::class, 'i');

        if ($currentIssue) {
            $qb->where('i.contentItem = ?1 AND i.status = ?2 AND i.id != ?3')
            ->setParameters([
                1 => $contentItem,
                2 => Issue::$issueStatusActive,
                3 => $currentIssue->getId()
            ]);
        } else {
            $qb->where('i.contentItem = ?1 AND i.status = ?2')
            ->setParameters([
                1 => $contentItem,
                2 => Issue::$issueStatusActive
            ]);
        }

        return $qb->getQuery()->getResult();
    }

    public function getManualResolvedIssuesByCourse(Course $course)
    {
        $contentItems = $course->getContentItems();

        $contentItemIds = [];
        foreach ($contentItems as $contentItemId => $contentItem) {
            $contentItemIds[] = $contentItemId;
        }

        return $this->createQueryBuilder('i')
            ->where('i.status = :status')
            ->andWhere('i.contentItem IN (:ids)')
            ->setParameter('status', 2)
            ->setParameter('ids', $contentItemIds)
            ->getQuery()
            ->getResult();
    }

    // Returns an array of Issue objects
    /*
    public function findByExampleField($value): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('i.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Issue
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
