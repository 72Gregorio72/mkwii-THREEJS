/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   user.interface.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alerusso <alerusso@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/07 15:25:30 by alerusso          #+#    #+#             */
/*   Updated: 2026/01/07 15:29:42 by alerusso         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

interface User 
{
	id: 		number;
	username: 	string;
	email: 		string;
	wins: 		number;
	losses:		number;
	isOnLine:	boolean;
	avatarUrl?:	string;
}

const newPlayer: User = 
{
	id: 		42,
	username: 	"Zeb89",
	email: 		"zeb.89@gmail.com",
	wins: 		10,
	losses:		0,
	isOnLine:	true,
}