/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   match.interface.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alerusso <alerusso@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/07 15:39:17 by alerusso          #+#    #+#             */
/*   Updated: 2026/01/07 16:28:43 by alerusso         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

enum	characters
{
	MARIO = "Mario",
	LUIGI = "Luigi",
}

enum	GameMap
{
	BOWSER_CASTLE = "Castello di Bowser",
	RAINBOW_ROAD = "Pista arcobaleno",
	MUU_MUU_FARM = "Fattoria Muu Muu",
}

@Entity('matches')
export class MatchResult 
{
	@PrimaryGeneratedColumn()
	id:				number;

	@Column({ type: 'enum', enum: characters })
	winner:			characters;

	@Column({ type : 'enum', enum: characters})
	loser:			characters;

	@Column("simple-array")
	score:			Array<number>;

	@Column({ nullable: true })
	timeSecond?:	number;

	@Column({type: 'enum', enum: GameMap})
	map:			GameMap;
}

/*
const partitaSbagliata: MatchResult = 
{
	id: 1,
	winner: "Mario",
	loser: "Luigi",
	score: [10, 5],
	map: "Circuito di Monza",
}
*/

const partitaCorretta: MatchResult = 
{
	id:		1,
	winner:	characters.MARIO,
	loser:	characters.LUIGI,
	score:	[10, 5],
	map:	GameMap.RAINBOW_ROAD,
}

console.log("Vincitore:", partitaCorretta.winner);