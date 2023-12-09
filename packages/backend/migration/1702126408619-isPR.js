export class  IsPR1702126408619 {
    name = 'IsPR1702126408619'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "isPR" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "meta"."failedRoleId" IS 'The ID of source Role.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "meta"."failedRoleId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isPR"`);
    }
}
